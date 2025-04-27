'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Checkout() {
  const router = useRouter()
  const { cart, propertyId, getCartTotal, clearCart } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calcola il totale del carrello 
  const cartTotal = getCartTotal()
  
  useEffect(() => {
    // Redirect if cart is empty
    if (!cart.length || !propertyId) {
      router.push('/')
      return
    }
    
    // Esegui automaticamente il checkout
    const autoCheckout = async () => {
      try {
        // Get property details
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
          
        if (propertyError) throw propertyError
        
        // Recupera l'account Stripe dell'host dalla tabella host_stripe_accounts
        const { data: hostStripeAccount, error: stripeError } = await supabase
          .from('host_stripe_accounts')
          .select('stripe_account_id, stripe_account_status')
          .eq('host_id', property.host_id)
          .single()
        
        let stripeAccountId = "active"
        
        if (!stripeError) {
          stripeAccountId = hostStripeAccount.stripe_account_id
          
          // Verifica che l'account sia attivo
          if (hostStripeAccount.stripe_account_status !== 'active') {
            console.warn('L\'account Stripe dell\'host non è attivo:', hostStripeAccount.stripe_account_status)
          }
        }
        
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
          
        if (orderError) {
          throw orderError
        }
        
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
          
        if (itemsError) {
          throw itemsError
        }
        
        // Reindirizza direttamente alla pagina di pagamento
        router.push(`/guest/payment/${order.id}`)
        
      } catch (error: any) {
        console.error('Checkout error:', error)
        setError(error.message || 'Errore durante il processo di checkout. Riprova più tardi.')
        setLoading(false)
        toast.error('Si è verificato un errore durante il processo di checkout.')
      }
    }
    
    autoCheckout()
  }, [cart, propertyId, router, cartTotal])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-spartan">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => router.push(`/guest/${propertyId}/extra-services`)}
            className="mt-4 px-4 py-2 bg-[#5E2BFF] text-white rounded-lg"
          >
            Torna ai servizi
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
          <p className="mt-4 text-gray-600">Elaborazione dell'ordine in corso...</p>
        </div>
      )}
    </div>
  )
} 