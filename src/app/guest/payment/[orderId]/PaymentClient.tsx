'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase'

// Inizializza Stripe fuori dal componente per evitare re-inizializzazioni
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '')

// Componente del form di pagamento separato per usare gli hooks correttamente
function CheckoutForm({ clientSecret, orderDetails }: { clientSecret: string, orderDetails: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setPaymentError(null)

    try {
      // Completa il pagamento quando il pulsante submit viene cliccato
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        setPaymentError(error.message || 'Si è verificato un errore durante il pagamento')
        setProcessing(false)
      } else {
        handlePaymentSuccess(paymentIntent!)
      }
    } catch (err: any) {
      console.error('Errore nell\'invio del pagamento:', err)
      setPaymentError('Il pagamento non è andato a buon fine. Riprova.')
      setProcessing(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // Aggiorna lo stato dell'ordine nel database
      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderDetails.id,
          paymentIntentId: paymentIntent.id,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Errore dalla API di conferma:', errorData)
        throw new Error(errorData.error || 'Errore nella conferma del pagamento')
      }
      
      const result = await response.json()
      console.log('Risultato conferma pagamento:', result)
      
      if (!result.success) {
        throw new Error('Impossibile aggiornare lo stato dell\'ordine')
      }

      // Reindirizza alla pagina di successo
      router.push(`/guest/checkout/success?orderId=${orderDetails.id}`)
    } catch (err: any) {
      console.error('Errore nella conferma del pagamento:', err)
      setPaymentError('Il pagamento è stato elaborato ma abbiamo avuto problemi ad aggiornare il tuo ordine. Contatta il supporto.')
      setProcessing(false)
    }
  }

  // Formatta il prezzo in valuta
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Riepilogo Ordine</h3>
        <div className="flex justify-between mb-2">
          <span>Subtotale:</span>
          <span>{formatPrice(orderDetails?.total_amount * 0.9 || 0)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Commissione (10%):</span>
          <span>{formatPrice(orderDetails?.total_amount * 0.1 || 0)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Totale:</span>
          <span>{formatPrice(orderDetails?.total_amount || 0)}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Metodo di Pagamento</h3>
        
        {/* Input carta standard */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dettagli Carta
          </label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>

        {paymentError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {paymentError}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="bg-[#ffde59] text-black px-4 py-2 rounded-full font-semibold hover:opacity-90 transition w-full"
        >
          {processing ? 'Elaborazione...' : 'Paga Ora'}
        </button>
      </div>
    </form>
  )
}

// Componente client per la pagina di pagamento
export default function PaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState('')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!orderId) return

    const fetchOrderAndCreateIntent = async () => {
      try {
        setLoading(true)
        
        // 1. Recupera i dettagli dell'ordine
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        // Se c'è un errore e siamo ancora entro il limite di tentativi
        if (orderError && retryCount < 3) {
          console.log(`Tentativo ${retryCount + 1}: Errore nel recupero dell'ordine, riprovo tra 1s...`)
          
          // Ritenta dopo un secondo
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 1000)
          return // Esci e aspetta il prossimo tentativo
        }

        if (orderError) {
          throw orderError
        }

        console.log('Dettagli ordine recuperati:', order)
        setOrderDetails(order)

        // 2. Crea payment intent
        const response = await fetch('/api/stripe/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: order.total_amount,
            propertyId: order.property_id
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Impossibile creare il payment intent')
        }

        const data = await response.json()
        if (!data.clientSecret) {
          throw new Error('Nessun client secret restituito dal payment intent')
        }
        
        setClientSecret(data.clientSecret)
        setLoading(false)
      } catch (err: any) {
        console.error('Errore nel recupero dell\'ordine o nella creazione del payment intent:', err)
        setError(err.message || 'Si è verificato un errore durante la preparazione del pagamento')
        setLoading(false)
      }
    }

    fetchOrderAndCreateIntent()
  }, [orderId, retryCount])

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  } : {}

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffde59] mx-auto"></div>
        <p className="text-center mt-4">Caricamento dettagli pagamento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-[#5E2BFF] text-white px-3 py-1 rounded"
          >
            Torna al Carrello
          </button>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Impossibile inizializzare il pagamento. Riprova.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-[#5E2BFF] text-white px-3 py-1 rounded"
          >
            Torna al Carrello
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        {orderDetails && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Riepilogo Ordine</h2>
            <p className="text-gray-600">ID Ordine: {orderDetails.id}</p>
            <p className="text-gray-600">Importo Totale: €{orderDetails.total_amount.toFixed(2)}</p>
          </div>
        )}
        
        {clientSecret && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm clientSecret={clientSecret} orderDetails={orderDetails} />
          </Elements>
        )}
      </div>
    </div>
  )
} 