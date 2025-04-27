'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Funzione per formattare i prezzi in Euro
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Dichiarazione ma non inizializzazione dello stripe Promise 
let stripePromise: Promise<any> | null = null;

export default function Checkout() {
  const router = useRouter()
  const { cart, propertyId, getCartTotal, clearCart } = useCart()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<{name: string, hostId: string} | null>(null)
  const [hostDetails, setHostDetails] = useState<{stripeAccountId: string} | null>(null)
  
  // Stati per il pagamento
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [stripePromiseState, setStripePromiseState] = useState<Promise<any> | null>(null)
  
  // Calcola il totale del carrello 
  const cartTotal = getCartTotal()
  
  useEffect(() => {
    // Redirect if cart is empty
    if (!cart.length || !propertyId) {
      router.push('/')
      return
    }
    
    // Fetch property and host details
    const fetchDetails = async () => {
      try {
        // Get property details
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
          
        if (propertyError) throw propertyError
        
        setPropertyDetails({
          name: property.name,
          hostId: property.host_id
        })
        
        // Recupera l'account Stripe dell'host dalla tabella host_stripe_accounts
        const { data: hostStripeAccount, error: stripeError } = await supabase
          .from('host_stripe_accounts')
          .select('stripe_account_id, stripe_account_status')
          .eq('host_id', property.host_id)
          .single()
        
        if (stripeError) {
          console.warn('Impossibile recuperare l\'account Stripe dell\'host:', stripeError)
          // Imposta un ID account Stripe fittizio per continuare il processo
          setHostDetails({
            stripeAccountId: "active"
          })
        } else {
          // Se l'account Stripe dell'host è stato trovato, impostalo
          setHostDetails({
            stripeAccountId: hostStripeAccount.stripe_account_id
          })
          
          // Verifica che l'account sia attivo
          if (hostStripeAccount.stripe_account_status !== 'active') {
            console.warn('L\'account Stripe dell\'host non è attivo:', hostStripeAccount.stripe_account_status)
          }
        }
        
      } catch (error) {
        console.error('Error fetching details:', error)
        setError('Could not load checkout details')
      }
    }
    
    fetchDetails()
  }, [cart, propertyId, router])
  
  // Handle checkout process
  const handleCheckout = async () => {
    if (loading) return
    if (!propertyDetails || !hostDetails) {
      setError('Property or host details are missing')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Avvio processo di checkout...')
      console.log('Dati del carrello:', cart)
      console.log('Property ID:', propertyId)
      console.log('Host Stripe Account:', hostDetails.stripeAccountId)
      
      // Prepare cart items for the API
      const cartItems = cart.map(item => ({
        productId: item.service.id,
        quantity: item.quantity,
        price: item.service.price,
        name: item.service.title
      }))
      
      console.log('Creazione ordine nel database...')
      
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            property_id: propertyId,
            total_amount: cartTotal,
            status: 'pending'
          }
        ])
        .select()
        .single()
        
      if (orderError) {
        console.error('Errore nella creazione dell\'ordine:', orderError)
        throw orderError
      }
      
      console.log('Ordine creato con successo:', order)
      setOrderId(order.id)
      
      // Add order items
      console.log('Aggiunta elementi dell\'ordine...')
      const orderItems = cart.map(item => ({
        order_id: order.id,
        extra_service_id: item.service.id,
        quantity: item.quantity,
        price: item.service.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        
      if (itemsError) {
        console.error('Errore nell\'aggiunta degli elementi dell\'ordine:', itemsError)
        throw itemsError
      }
      
      console.log('Elementi dell\'ordine aggiunti con successo')
      
      // Crea un payment intent
      console.log('Creazione del payment intent...')
      const paymentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: order.id,
          amount: cartTotal
        }),
      })
      
      if (!paymentResponse.ok) {
        throw new Error('Errore nella creazione del payment intent')
      }
      
      const { clientSecret, stripeAccountId } = await paymentResponse.json()
      setClientSecret(clientSecret)
      
      // Inizializza Stripe con l'account dell'host
      if (stripeAccountId) {
        console.log("Inizializzazione Stripe con account:", stripeAccountId)
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
          stripeAccount: stripeAccountId,
        })
        setStripePromiseState(stripePromise)
      } else {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        setStripePromiseState(stripePromise)
      }
      
      setPaymentReady(true)
      setShowPayment(true)
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Failed to process checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
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
            <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.service.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.service.title}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold">{formatPrice(item.service.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Property Information */}
          {propertyDetails && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-6">
              <h3 className="font-bold mb-2">Property Information</h3>
              <p>{propertyDetails.name}</p>
            </div>
          )}
          
          {/* Checkout Button (visibile solo prima del pagamento) */}
          {!showPayment && (
            <button
              onClick={handleCheckout}
              disabled={loading || !hostDetails}
              className={`w-full py-3 rounded-xl font-bold ${
                loading || !hostDetails
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ffde59] text-black hover:bg-opacity-90'
              }`}
            >
              {loading ? 'Processing...' : 'Procedi al Pagamento'}
            </button>
          )}
          
          {/* Sezione di pagamento (visibile dopo il checkout) */}
          {showPayment && paymentReady && clientSecret && stripePromiseState && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Inserisci i dati di pagamento</h2>
              <Elements stripe={stripePromiseState} options={{ clientSecret }}>
                <CheckoutForm orderId={orderId!} clientSecret={clientSecret} />
              </Elements>
            </div>
          )}
          
          <div className="text-center mt-4">
            <Link 
              href={propertyId ? `/guest/${propertyId}/extra-services` : '/'}
              className="text-[#5E2BFF] hover:underline"
            >
              Return to services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente per il form di pagamento
function CheckoutForm({ 
  orderId, 
  clientSecret
}: { 
  orderId: string, 
  clientSecret: string
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
      console.log("Confermo il pagamento con clientSecret:", clientSecret)
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })
      
      if (error) {
        console.error("Errore di pagamento:", error)
        setPaymentError(`Pagamento fallito: ${error.message}`)
        setProcessing(false)
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true)
        setPaymentError(null)
        
        // Aggiorna lo stato dell'ordine nel database
        await updateOrderStatus()
        
        // Reindirizza alla pagina di successo
        router.push(`/guest/checkout/success?orderId=${orderId}`)
      }
    } catch (error: any) {
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
    <div className="p-6 bg-white rounded-lg shadow-md">
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
          className="w-full px-4 py-3 text-black font-semibold rounded-xl bg-[#ffde59] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Elaborazione...' : 'Paga ora'}
        </button>
      </form>
    </div>
  )
} 