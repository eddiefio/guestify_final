'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart, propertyId } = useCart()
  const orderId = searchParams?.get('orderId')
  const [orderPropertyId, setOrderPropertyId] = useState<string | null>(null)

  // Pulisci il carrello quando l'utente arriva alla pagina di successo
  useEffect(() => {
    clearCart()
  }, [clearCart])

  // Recupera la property_id dall'ordine se non è disponibile nel carrello
  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Se abbiamo già il propertyId dal context, non serve fare la query
      if (propertyId) {
        setOrderPropertyId(propertyId)
        return
      }

      // Se abbiamo l'orderId ma non il propertyId, recupera i dettagli dell'ordine
      if (orderId) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('property_id')
            .eq('id', orderId)
            .single()
            
          if (error) throw error
          
          if (data && data.property_id) {
            setOrderPropertyId(data.property_id)
          }
        } catch (error) {
          console.error('Errore nel recupero dei dettagli dell\'ordine:', error)
        }
      }
    }
    
    fetchOrderDetails()
  }, [orderId, propertyId])

  // Determina l'URL di destinazione per il pulsante di ritorno
  const getReturnUrl = () => {
    // Se abbiamo il propertyId (dal context o dall'ordine), torna alla pagina della proprietà
    if (propertyId || orderPropertyId) {
      return `/guest/${propertyId || orderPropertyId}`
    }
    // Altrimenti torna alla home
    return '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push(getReturnUrl())}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Order Completed</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-6">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Thanks for your order on Guestify!
                  </p>
                </div>
              </div>
            </div>
            
            {orderId && (
              <p className="text-sm mb-4">Order Number: <span className="font-medium">{orderId}</span></p>
            )}
            
            <p className="text-sm text-gray-600 mb-6">
              Thanks for your purchase. Your order was completed with success.
            </p>
            
            <div className="mt-8">
              <Link href={getReturnUrl()} className="bg-[#ffde59] text-black px-4 py-2 rounded-full text-sm hover:opacity-90 transition font-semibold inline-block">
                Return Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 