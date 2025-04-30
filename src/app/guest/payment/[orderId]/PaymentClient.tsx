'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { ChevronLeft } from 'lucide-react'
import ApplePayButton from './ApplePayButton'

// Funzione per formattare i prezzi in Euro
const formatEuro = (price: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

// Inizializzazione di Stripe (una sola volta fuori dal componente)
// Aggiunto log per verificare se la chiave è definita correttamente
console.log("STRIPE KEY definita:", !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ 
  orderId, 
  clientSecret,
  order,
  stripeAccountId
}: { 
  orderId: string, 
  clientSecret: string,
  order: any,
  stripeAccountId: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      // Stripe.js non è ancora caricato
      console.log("Stripe o Elements non ancora caricati");
      return
    }
    
    setProcessing(true)
    setPaymentError(null)
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/guest/checkout?orderId=${orderId}&subtotal=${order.subtotal || 0}&serviceFee=${order.serviceFee || 0}&finalPrice=${order.total_price || 0}&propertyId=${order.apartment_id}`,
        },
        redirect: 'if_required',
      })
      
      if (error) {
        setPaymentError(error.message || 'Errore durante il pagamento')
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Pagamento completato con successo
        await handlePaymentSuccess(paymentIntent)
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Errore durante il pagamento')
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
          orderId: order.id,
          paymentIntentId: paymentIntent.id,
        }),
      })
      
      // Verifica che la risposta sia ok
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error from confirm API:', errorData)
        throw new Error(errorData.error || 'Error confirming payment')
      }
      
      const result = await response.json()
      console.log('Confirm payment result:', result)
      
      // Assicuriamoci che l'inventario sia stato aggiornato
      if (!result.success) {
        throw new Error('Failed to update inventory')
      }
      
      setSucceeded(true)
      
      // Redirect alla pagina di successo
      router.push(`/guest/checkout?orderId=${order.id}&subtotal=${order.subtotal || 0}&serviceFee=${order.serviceFee || 0}&finalPrice=${order.total_price || 0}&propertyId=${order.apartment_id}`)
    } catch (err) {
      console.error('Error confirming payment:', err)
      setPaymentError('Il pagamento è stato elaborato ma abbiamo avuto problemi ad aggiornare il tuo ordine. Contatta il supporto.')
      setProcessing(false)
    }
  }
  
  const handleApplePaySuccess = async (paymentIntent: any) => {
    await handlePaymentSuccess(paymentIntent)
  }
  
  const handleApplePayError = (error: any) => {
    setPaymentError(error.message || 'Errore durante il pagamento con Apple Pay')
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Dettagli Pagamento</h2>
      
      {/* Mostra l'importo totale dell'ordine */}
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Totale Ordine:</p>
        <p className="text-2xl font-bold">{formatEuro(order.total_price)}</p>
      </div>
      
      {/* Pulsante Apple Pay */}
      <ApplePayButton 
        clientSecret={clientSecret}
        amount={order.total_price}
        onSuccess={handleApplePaySuccess}
        onError={handleApplePayError}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <PaymentElement
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              paymentMethodOrder: ['apple_pay', 'card','google_pay']
            }}
          />
        </div>
        
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {paymentError}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || processing || succeeded}
          className="w-full px-4 py-2 text-white font-semibold rounded-md bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Loading...' : 'Pay Now'}
        </button>
      </form>
    </div>
  )
}

export default function PaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [order, setOrder] = useState<any>(null)
  const [stripeAccountId, setStripeAccountId] = useState<string>('')
  
  // Carica i dettagli dell'ordine e crea l'intento di pagamento
  useEffect(() => {
    const fetchOrderAndCreateIntent = async () => {
      try {
        // Recupera i dettagli dell'ordine
        const orderResponse = await fetch(`/api/orders/${orderId}`)
        
        if (!orderResponse.ok) {
          throw new Error('Impossibile recuperare i dettagli dell\'ordine')
        }
        
        const orderData = await orderResponse.json()
        setOrder(orderData)
        
        // Recupera l'ID dell'account Stripe dell'host
        const propertyResponse = await fetch(`/api/properties/${orderData.apartment_id}`)
        
        if (!propertyResponse.ok) {
          throw new Error('Impossibile recuperare i dettagli della proprietà')
        }
        
        const propertyData = await propertyResponse.json()
        const hostId = propertyData.host_id
        
        // Ottieni l'ID dell'account Stripe dell'host
        const hostResponse = await fetch(`/api/hosts/${hostId}`)
        
        if (!hostResponse.ok) {
          throw new Error('Impossibile recuperare i dettagli dell\'host')
        }
        
        const hostData = await hostResponse.json()
        
        if (!hostData.stripe_account_id) {
          throw new Error('L\'host non ha configurato un account Stripe per i pagamenti')
        }
        
        setStripeAccountId(hostData.stripe_account_id)
        
        // Crea l'intento di pagamento
        const intentResponse = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: orderData.total_price,
            stripeAccountId: hostData.stripe_account_id
          })
        })
        
        if (!intentResponse.ok) {
          const errorData = await intentResponse.json()
          throw new Error(errorData.error || 'Errore nella creazione dell\'intento di pagamento')
        }
        
        const intentData = await intentResponse.json()
        setClientSecret(intentData.clientSecret)
        setLoading(false)
      } catch (err: any) {
        console.error('Errore:', err)
        setError(err.message || 'Si è verificato un errore')
        setLoading(false)
      }
    }
    
    fetchOrderAndCreateIntent()
  }, [orderId])
  
  // Crea l'oggetto stripePromise con l'account ID
  const stripePromiseWithAccount = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    { stripeAccount: stripeAccountId }
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Payment Method</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            <p>{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Torna indietro
            </button>
          </div>
        ) : (
          <Elements 
            stripe={stripePromiseWithAccount} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#5E2BFF',
                  colorBackground: '#ffffff',
                  colorText: '#30313d',
                  colorDanger: '#df1b41',
                  fontFamily: 'League Spartan, system-ui, sans-serif',
                  borderRadius: '8px'
                }
              }
            }}
          >
            <CheckoutForm 
              orderId={orderId} 
              clientSecret={clientSecret} 
              order={order} 
              stripeAccountId={stripeAccountId}
            />
          </Elements>
        )}
      </div>
    </div>
  )
} 