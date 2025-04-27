'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Funzione per formattare i prezzi in Euro
const formatEuro = (price: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

// Dichiarazione ma non inizializzazione dello stripe Promise 
let stripePromise: Promise<any> | null = null;

export default function PaymentClient({ orderId }: { orderId: string }) {
  const [stripePromiseState, setStripePromiseState] = useState<Promise<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderAndInitializeStripe = async () => {
      try {
        setLoading(true);
        
        // 1. Carica i dettagli dell'ordine
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (!orderResponse.ok) {
          throw new Error('Ordine non trovato');
        }
        const orderData = await orderResponse.json();
        setOrder(orderData);
        
        // 2. Crea un singolo payment intent che useremo sia per l'inizializzazione che per il pagamento
        const paymentResponse = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderId: orderId,
            amount: orderData.total_amount || 0
          }),
        });
        
        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json().catch(() => null);
          const errorMessage = errorData?.error || 'Errore nella creazione del payment intent';
          console.error('Errore payment intent:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const responseData = await paymentResponse.json().catch(err => {
          console.error('Errore nel parsing della risposta:', err);
          throw new Error('Risposta dal server non valida');
        });
        
        const { clientSecret, stripeAccountId } = responseData;
        
        if (!clientSecret) {
          throw new Error('Client secret non disponibile');
        }
        
        setClientSecret(clientSecret);
        
        // 3. Inizializza Stripe con l'account dell'host
        if (stripeAccountId) {
          console.log("Inizializzazione Stripe con account:", stripeAccountId);
          stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
            stripeAccount: stripeAccountId, // Specifica l'account Stripe dell'host
          });
          setStripePromiseState(stripePromise);
        } else {
          stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
          setStripePromiseState(stripePromise);
        }
      } catch (error) {
        console.error("Errore:", error);
        setError(error instanceof Error ? error.message : "Si è verificato un errore");
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderAndInitializeStripe();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Inizializzazione pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Errore</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!stripePromiseState || !clientSecret || !order) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Errore</h2>
        <p>Impossibile inizializzare il sistema di pagamento. Riprova più tardi.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromiseState} options={{ clientSecret }}>
      <CheckoutForm orderId={orderId} clientSecret={clientSecret} order={order} />
    </Elements>
  )
}

function CheckoutForm({ 
  orderId, 
  clientSecret,
  order
}: { 
  orderId: string, 
  clientSecret: string,
  order: any
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
      return
    }
    
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      return
    }
    
    setProcessing(true)
    
    try {
      console.log("Confermo il pagamento con clientSecret:", clientSecret);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })
      
      if (error) {
        console.error("Errore di pagamento:", error);
        setPaymentError(`Pagamento fallito: ${error.message}`);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true)
        setPaymentError(null)
        
        // Aggiorna lo stato dell'ordine nel database
        await updateOrderStatus()
        
        // Reindirizza alla pagina di successo
        router.push(`/guest/checkout/success?orderId=${orderId}`)
      }
    } catch (error) {
      console.error("Errore durante la conferma del pagamento:", error)
      setPaymentError("Si è verificato un errore durante l'elaborazione del pagamento")
      setProcessing(false)
    }
  }
  
  const updateOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      })
      
      if (!response.ok) {
        console.error('Errore nell\'aggiornamento dello stato dell\'ordine')
      }
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Completa il tuo pagamento</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Riepilogo ordine</h3>
        <p className="text-sm text-gray-600 mb-1">ID ordine: {orderId}</p>
        <p className="text-sm text-gray-600 mb-3">Data: {new Date(order.created_at).toLocaleDateString()}</p>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <p className="font-semibold text-lg">Totale: {formatEuro(order.total_amount)}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dati carta di credito
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
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
          {processing ? 'Elaborazione...' : 'Paga ora'}
        </button>
      </form>
    </div>
  )
} 