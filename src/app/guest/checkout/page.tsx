'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Carica l'istanza di Stripe al di fuori del componente
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '')

// Componente del form di pagamento
function CheckoutForm({ clientSecret, onPaymentComplete, onError }: { 
  clientSecret: string, 
  onPaymentComplete: () => void,
  onError: (error: Error) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }
    
    setIsProcessing(true)
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/guest/checkout/success`,
        },
      })
      
      if (error) {
        onError(error)
        console.error('Payment error:', error)
      } else {
        onPaymentComplete()
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      onError(err)
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 mt-4 rounded-xl font-bold bg-[#ffde59] text-black hover:bg-opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Elaborazione...' : 'Paga Ora'}
      </button>
    </form>
  )
}

export default function Checkout() {
  const router = useRouter()
  const { cart, propertyId, getCartTotal, clearCart } = useCart()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<{name: string, hostId: string} | null>(null)
  const [hostDetails, setHostDetails] = useState<{stripeAccountId: string} | null>(null)
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null)
  const [checkoutSession, setCheckoutSession] = useState<string | null>(null)
  
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
        
        // Get host's Stripe account
        const { data: hostStripe, error: hostError } = await supabase
          .from('host_stripe_accounts')
          .select('stripe_account_id')
          .eq('host_id', property.host_id)
          .single()
          
        if (hostError) {
          console.error('Host Stripe account error:', hostError)
          setError('This host is not set up to accept payments yet')
          return
        }
        
        if (!hostStripe?.stripe_account_id) {
          setError('Host payment details are not available')
          return
        }
        
        setHostDetails({
          stripeAccountId: hostStripe.stripe_account_id
        })
        
      } catch (error) {
        console.error('Error fetching details:', error)
        setError('Could not load checkout details')
      }
    }
    
    fetchDetails()
  }, [cart, propertyId, router])
  
  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }
  
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
      
      // Prepare cart items for the API
      const cartItems = cart.map(item => ({
        productId: item.service.id,
        quantity: item.quantity,
        price: item.service.price,
        name: item.service.title
      }))
      
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
        
      if (orderError) throw orderError
      
      // Add order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        extra_service_id: item.service.id,
        quantity: item.quantity,
        price: item.service.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        
      if (itemsError) throw itemsError
      
      // Create Stripe Checkout Session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          propertyId,
          amount: cartTotal,
          stripeAccountId: hostDetails.stripeAccountId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
      
      const data = await response.json()
      
      // Imposta il client secret di Stripe per il pagamento integrato
      if (data.clientSecret) {
        setPaymentClientSecret(data.clientSecret)
      } else {
        // Opzione alternativa: reindirizzamento a pagina di checkout Stripe esterna
        setCheckoutSession(data.sessionId)
        window.location.href = data.url
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Failed to process checkout. Please try again.')
      setLoading(false)
    }
  }
  
  const handlePaymentComplete = () => {
    clearCart()
    router.push('/guest/checkout/success')
  }
  
  const handlePaymentError = (error: Error) => {
    setError(error.message || 'Si è verificato un errore durante il pagamento. Riprova.')
    setLoading(false)
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
          
          {/* Stripe Payment Element (se è disponibile un clientSecret) */}
          {paymentClientSecret ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-6">
              <h3 className="font-bold mb-4">Dettagli Pagamento</h3>
              <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                <CheckoutForm 
                  clientSecret={paymentClientSecret} 
                  onPaymentComplete={handlePaymentComplete}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          ) : (
            /* Checkout Button per reindirizzamento a pagina Stripe esterna */
            <button
              onClick={handleCheckout}
              disabled={loading || !hostDetails}
              className={`w-full py-3 rounded-xl font-bold ${
                loading || !hostDetails
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ffde59] text-black hover:bg-opacity-90'
              }`}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
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