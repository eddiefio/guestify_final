'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function OrderSuccess() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!orderId) return
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (!response.ok) {
          throw new Error('Impossibile recuperare i dettagli dell\'ordine')
        }
        
        const data = await response.json()
        setOrder(data)
      } catch (error) {
        console.error('Errore:', error)
        setError(error instanceof Error ? error.message : 'Si è verificato un errore')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrderDetails()
  }, [orderId])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }
  
  if (error || !order) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Errore</h2>
        <p>{error || 'Impossibile caricare i dettagli dell\'ordine'}</p>
        <Link 
          href="/"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Torna alla home
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ordine Completato!</h1>
        <p className="text-gray-600">
          Grazie per il tuo ordine. Il pagamento è stato elaborato con successo.
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Riepilogo ordine</h3>
        <p className="text-sm text-gray-600 mb-1">ID ordine: {orderId}</p>
        <p className="text-sm text-gray-600 mb-3">
          Data: {new Date(order.created_at).toLocaleDateString()}
        </p>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Servizi acquistati</h4>
          <ul className="divide-y divide-gray-200">
            {order.items && order.items.map((item: any) => (
              <li key={item.id} className="py-2">
                <div className="flex justify-between">
                  <span>
                    {item.extra_services?.title || 'Servizio'} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between font-semibold">
            <span>Totale</span>
            <span>€{order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Link 
          href={`/guest/${order.property_id}`}
          className="inline-block px-6 py-3 bg-[#5E2BFF] text-white font-semibold rounded-lg hover:bg-opacity-90 transition duration-200"
        >
          Torna alla proprietà
        </Link>
      </div>
    </div>
  )
} 