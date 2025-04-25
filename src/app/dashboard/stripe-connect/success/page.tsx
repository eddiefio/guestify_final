'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

function StripeSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Verifica il completamento dell'onboarding
    const verifyOnboarding = async () => {
      try {
        // Chiama l'API per verificare lo stato dell'account
        const response = await fetch('/api/stripe/onboarding-complete', {
          method: 'GET',
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error verifying Stripe account')
        }
        
        // Mostra un messaggio di successo
        toast.success('Stripe account connected successfully!')
        
        // Gestisci il reindirizzamento
        const redirect = searchParams.get('redirect')
        if (redirect) {
          router.push(redirect)
        } else {
          router.push('/dashboard/stripe-connect')
        }
      } catch (error: any) {
        console.error('Error in onboarding completion:', error)
        toast.error(error.message || 'Error completing Stripe setup')
        router.push('/dashboard/stripe-connect')
      }
    }
    
    verifyOnboarding()
  }, [router, searchParams])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5E2BFF] mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Completing Stripe Setup...</h2>
        <p className="text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  )
}

export default function StripeConnectSuccess() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5E2BFF] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <StripeSuccessContent />
    </Suspense>
  )
} 