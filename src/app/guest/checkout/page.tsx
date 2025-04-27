'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'

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
    
    // Esegui immediatamente il processo di checkout
    const processCheckout = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Avvio processo di checkout automatico...')
        console.log('Dati del carrello:', cart)
        console.log('Property ID:', propertyId)
        
        // Fetch property details
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
          
        if (propertyError) throw propertyError
        
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
    
    processCheckout()
  }, [cart, propertyId, router, cartTotal])
  
  // Mostra solo un loader durante il processo
  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex items-center justify-center">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-bold mb-2">Errore</p>
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-black"
          >
            Torna indietro
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF] mb-4"></div>
          <p className="text-gray-600">Elaborazione dell'ordine in corso...</p>
        </div>
      )}
    </div>
  )
}