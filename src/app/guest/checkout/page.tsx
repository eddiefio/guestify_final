'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function Checkout() {
  const router = useRouter()
  const { cart, propertyId, getCartTotal, clearCart } = useCart()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<{name: string, hostId: string} | null>(null)
  const [hostDetails, setHostDetails] = useState<{stripeAccountId: string} | null>(null)
  
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
  
  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
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
      
      console.log('Avvio processo di checkout...')
      console.log('Dati del carrello:', cart)
      console.log('Property ID:', propertyId)
      
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
      
      // Reindirizza alla pagina di pagamento
      console.log('Reindirizzamento alla pagina di pagamento:', `/guest/payment/${order.id}`)
      router.push(`/guest/payment/${order.id}`)
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Failed to process checkout. Please try again.')
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
          
          {/* Checkout Button */}
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