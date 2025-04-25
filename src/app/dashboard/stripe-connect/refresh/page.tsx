'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

function RefreshContent() {
  const router = useRouter()
  
  useEffect(() => {
    // Mostra un messaggio all'utente
    toast.error('Stripe setup was not completed. Please try again.')
    
    // Reindirizza alla pagina di connessione dopo un breve ritardo
    const timer = setTimeout(() => {
      router.push('/dashboard/stripe-connect')
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto mb-4 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Stripe Setup Interrupted</h2>
        <p className="text-gray-600">Redirecting back to the connection page...</p>
      </div>
    </div>
  )
}

export default function StripeConnectRefresh() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5E2BFF] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <RefreshContent />
    </Suspense>
  )
} 