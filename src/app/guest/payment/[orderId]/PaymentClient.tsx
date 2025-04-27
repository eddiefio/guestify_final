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
      console.log("Confermo il pagamento con clientSecret:", clientSecret.substring(0, 10) + "...");
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Ritorna a questa URL dopo che il pagamento è completo
          return_url: `${window.location.origin}/guest/checkout/success?orderId=${orderId}`,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        console.error("Errore di pagamento:", error);
        setPaymentError(`Pagamento fallito: ${error.message}`);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Pagamento completato con successo:", paymentIntent.id);
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
      console.log("Aggiornamento stato ordine a PAID:", orderId);
      const response = await fetch(`/api/orders/${orderId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      })
      
      if (!response.ok) {
        console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', response.status);
        const errorText = await response.text();
        console.error('Dettagli errore:', errorText);
      } else {
        const result = await response.json();
        console.log('Stato ordine aggiornato con successo:', result);
      }
    } catch (error) {
      console.error('Errore nella richiesta di aggiornamento:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Complete your purchase</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2 text-gray-900">Order summary</h3>
        <p className="text-sm text-gray-600 mb-1">ID ordor: {orderId}</p>
        <p className="text-sm text-gray-600 mb-3">Date: {new Date(order.created_at).toLocaleDateString()}</p>
        
        {order.items && order.items.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-800">Details:</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              {order.items.map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.extra_services?.title || 'Servizio'}</span>
                  <span>{formatEuro(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-2 mt-2">
          <p className="font-semibold text-lg flex justify-between text-gray-900">
            <span>Total:</span>
            <span>{formatEuro(order.total_amount)}</span>
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <PaymentElement
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              paymentMethodOrder: ['apple_pay', 'google_pay', 'card']
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
          {processing ? 'Elaborazione...' : 'Paga ora'}
        </button>
      </form>
    </div>
  )
}

export default function PaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const loadOrderAndInitializeStripe = async () => {
      if (!orderId) {
        console.log("PaymentClient: Nessun orderId fornito");
        return;
      }
      
      console.log(`PaymentClient: Caricamento ordine e inizializzazione Stripe per ordine: ${orderId}, tentativo: ${retryCount + 1}`);
      
      try {
        setLoading(true)
        
        // 1. Carica i dettagli dell'ordine
        console.log(`PaymentClient: Recupero dettagli ordine: ${orderId}`);
        const orderResponse = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log(`PaymentClient: Stato risposta ordine:`, orderResponse.status);
        
        if (!orderResponse.ok) {
          const contentType = orderResponse.headers.get('content-type');
          console.log("PaymentClient: Content-Type risposta:", contentType);
          
          let errorMessage = `Errore nel recupero dell'ordine: ${orderResponse.status} ${orderResponse.statusText}`;
          
          try {
            if (contentType && contentType.includes('application/json')) {
              const errorData = await orderResponse.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              // Se il content-type non è JSON, potrebbe essere HTML causato da un reindirizzamento
              const text = await orderResponse.text();
              console.error('Risposta non-JSON ricevuta:', text.substring(0, 150) + '...');
              errorMessage = 'Il server ha restituito HTML invece di JSON. Possibile problema di autenticazione.';
            }
          } catch (parseError) {
            console.error('Errore nel parsing della risposta:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        let orderData;
        try {
          orderData = await orderResponse.json();
        } catch (jsonError) {
          console.error('Errore nel parsing JSON della risposta ordine:', jsonError);
          // Tenta di leggere la risposta come testo per diagnosi
          const text = await orderResponse.text();
          console.error('Contenuto risposta non valida:', text.substring(0, 150) + '...');
          throw new Error('Impossibile interpretare la risposta del server come JSON. Risposta non valida.');
        }
        
        console.log(`PaymentClient: Dati ordine ricevuti:`, {
          id: orderData.id,
          total_amount: orderData.total_amount,
          items: orderData.items?.length || 0
        });
        
        setOrder(orderData);
        
        // 2. Crea un payment intent
        console.log(`PaymentClient: Creazione payment intent per ordine: ${orderId} con importo: ${orderData.total_amount}`);
        const paymentResponse = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ 
            orderId: orderId,
            amount: orderData.total_amount || 0
          }),
        });
        
        console.log(`PaymentClient: Stato risposta payment intent:`, paymentResponse.status);
        
        if (!paymentResponse.ok) {
          const contentType = paymentResponse.headers.get('content-type');
          console.log("PaymentClient: Content-Type risposta payment:", contentType);
          
          let errorMessage = `Errore nella creazione del payment intent: ${paymentResponse.status} ${paymentResponse.statusText}`;
          
          try {
            if (contentType && contentType.includes('application/json')) {
              const errorData = await paymentResponse.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              // Se il content-type non è JSON, potrebbe essere HTML causato da un reindirizzamento
              const text = await paymentResponse.text();
              console.error('Risposta payment non-JSON ricevuta:', text.substring(0, 150) + '...');
              errorMessage = 'Il server ha restituito HTML invece di JSON per il payment intent. Possibile problema di autenticazione.';
            }
          } catch (parseError) {
            console.error('Errore nel parsing della risposta payment:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        let responseData;
        try {
          responseData = await paymentResponse.json();
        } catch (jsonError) {
          console.error('Errore nel parsing JSON della risposta payment:', jsonError);
          // Tenta di leggere la risposta come testo per diagnosi
          const text = await paymentResponse.text();
          console.error('Contenuto risposta payment non valida:', text.substring(0, 150) + '...');
          throw new Error('Impossibile interpretare la risposta del payment intent come JSON. Risposta non valida.');
        }
        
        if (!responseData.clientSecret) {
          console.error('PaymentClient: clientSecret mancante nella risposta', responseData);
          throw new Error('Client secret non disponibile');
        }
        
        setClientSecret(responseData.clientSecret);
        
        // Salva l'ID dell'account Stripe dell'host
        if (responseData.stripeAccountId) {
          console.log(`PaymentClient: Account Stripe dell'host: ${responseData.stripeAccountId}`);
          setStripeAccountId(responseData.stripeAccountId);
        } else {
          console.warn('PaymentClient: stripeAccountId mancante nella risposta');
        }
        
        console.log(`PaymentClient: Inizializzazione completata con successo`);
      } catch (error) {
        console.error("Errore in loadOrderAndInitializeStripe:", error);
        setError(error instanceof Error ? error.message : "Si è verificato un errore");
        
        // Se abbiamo meno di 3 tentativi, proviamo di nuovo dopo un breve ritardo
        if (retryCount < 2) {
          console.log(`PaymentClient: Ritentativo ${retryCount + 1}/3 tra 2 secondi...`);
          setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderAndInitializeStripe();
  }, [orderId, retryCount]);

  // Se stiamo ancora caricando o stiamo per riprovare, mostriamo il loader
  if (loading || (error && retryCount < 2)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {loading ? 'Inizializzazione pagamento...' : `Tentativo di riconnessione ${retryCount + 1}/3...`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Errore</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => router.push(`/guest/checkout`)}
              className="w-full px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Torna al checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !order || !stripeAccountId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Errore</h2>
            <p>Impossibile inizializzare il sistema di pagamento. Riprova più tardi.</p>
            <p className="mt-2 text-sm text-gray-500">
              {!clientSecret ? 'Client Secret non disponibile.' : ''}
              {!order ? 'Dettagli ordine non disponibili.' : ''}
              {!stripeAccountId ? 'Account Stripe dell\'host non disponibile.' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inizializza Stripe con l'opzione stripeAccount per specificare l'account dell'host
  const stripePromiseWithAccount = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
    stripeAccount: stripeAccountId
  });

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
      </div>
    </div>
  )
} 