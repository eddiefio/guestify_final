'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [isLoading, setIsLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const processCheckoutSuccess = async () => {
      if (!sessionId) {
        setError('Sessione di pagamento non trovata')
        setIsLoading(false)
        return
      }

      try {
        // Recupera l'ordine usando l'ID della sessione Stripe
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*, guests(name), hosts(name)')
          .eq('stripe_session_id', sessionId)
          .single()

        if (orderError || !order) {
          console.error('Errore nel recupero dell\'ordine:', orderError)
          setError('Impossibile trovare i dettagli dell\'ordine')
          setIsLoading(false)
          return
        }

        // Aggiorna lo stato dell'ordine a "completed"
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'completed', paid_at: new Date().toISOString() })
          .eq('id', order.id)

        if (updateError) {
          console.error('Errore nell\'aggiornamento dell\'ordine:', updateError)
          // Continuiamo comunque per mostrare la conferma
        }

        // Recupera gli elementi dell'ordine
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*, extra_services(title, description)')
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Errore nel recupero degli elementi dell\'ordine:', itemsError)
          // Continuiamo con i dati che abbiamo
        }

        setOrderDetails({
          ...order,
          items: orderItems || []
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Errore durante il processo di conferma:', error)
        setError('Si è verificato un errore durante il processo di conferma dell\'ordine')
        setIsLoading(false)
      }
    }

    processCheckoutSuccess()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
        <p className="mt-4 text-gray-600">Stiamo elaborando il tuo ordine...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm w-full max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Si è verificato un errore</h1>
          <p className="text-gray-700">{error}</p>
          <Link 
            href="/guest/dashboard" 
            className="mt-6 w-full bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200 flex items-center justify-center font-bold"
          >
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center">Pagamento Completato con Successo!</h1>
          <p className="text-gray-600 mt-2 text-center">
            Grazie per il tuo ordine. Il tuo pagamento è stato elaborato con successo.
          </p>
        </div>

        <div className="border-t border-b border-gray-200 py-6 my-6">
          <h2 className="text-lg font-semibold mb-4">Riepilogo dell'Ordine</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Numero Ordine</p>
              <p className="font-medium">{orderDetails.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium">{new Date(orderDetails.created_at).toLocaleDateString('it-IT')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Ospite</p>
              <p className="font-medium">{orderDetails.guests?.name || 'N/D'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Host</p>
              <p className="font-medium">{orderDetails.hosts?.name || 'N/D'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Totale</p>
              <p className="font-medium text-lg">€{orderDetails.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {orderDetails.items.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Servizi Acquistati</h2>
            <ul className="divide-y divide-gray-200">
              {orderDetails.items.map((item: any) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.extra_services?.title || 'Servizio'}</p>
                      <p className="text-sm text-gray-600">{item.extra_services?.description || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Quantità: {item.quantity}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/guest/dashboard" 
            className="w-full bg-[#5E2BFF] text-white py-3 rounded-lg hover:bg-opacity-90 transition duration-200 text-center font-bold"
          >
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// Componente principale che utilizza Suspense
export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
        <p className="mt-4 text-gray-600">Caricamento in corso...</p>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
} 