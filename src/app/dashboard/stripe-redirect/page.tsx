'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Componente che utilizza useSearchParams
function StripeRedirectContent() {
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('Processing your Stripe connection...')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !searchParams) return

    const handleStripeRedirect = async () => {
      try {
        console.log('Processing Stripe redirect with user:', user.id)
        
        const accountId = searchParams.get('account_id')
        const success = searchParams.get('success')
        const error = searchParams.get('error')
        
        if (error) {
          throw new Error('Error during Stripe onboarding process')
        }
        
        if (!accountId) {
          throw new Error('No Stripe account ID provided in redirect')
        }
        
        console.log('Received Stripe account ID:', accountId)

        // Verify the Stripe account is properly configured
        const verifyResponse = await fetch('/api/stripe/verify-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            accountId: accountId 
          })
        })
        
        const verifyData = await verifyResponse.json()
        
        if (!verifyResponse.ok || !verifyData.isValid) {
          console.error('Stripe account validation failed:', verifyData.message)
          
          // Update account status to 'error' in database
          await supabase
            .from('host_stripe_accounts')
            .update({
              stripe_account_status: 'error',
              updated_at: new Date().toISOString()
            })
            .eq('host_id', user.id)
            .eq('stripe_account_id', accountId)
          
          setStatus('error')
          setMessage(`Stripe account setup failed: ${verifyData.message}. Please try again.`)
          return
        }
        
        // Update the host_stripe_accounts table
        const { error: updateError } = await supabase
          .from('host_stripe_accounts')
          .update({
            stripe_account_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('host_id', user.id)
          .eq('stripe_account_id', accountId)
        
        if (updateError) {
          console.error('Error updating Stripe account status:', updateError)
          setStatus('error')
          setMessage('There was an error updating your account status. Please try again.')
          return
        }
        
        setStatus('success')
        setMessage('Your Stripe account has been successfully connected!')
        
        // Get the stored return URL or default to dashboard
        const returnUrl = localStorage.getItem('stripe-connect-return-url') || '/dashboard'
        localStorage.removeItem('stripe-connect-return-url')
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          toast.success('Stripe account connected successfully!')
          router.push(returnUrl)
        }, 2000)
        
      } catch (err: any) {
        console.error('Error in Stripe redirect:', err)
        setStatus('error')
        setMessage(err.message || 'An error occurred during the Stripe connection process')
      }
    }

    handleStripeRedirect()
  }, [user, searchParams, router])

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md mt-16 font-spartan text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Processing Your Connection</h2>
          <p className="text-gray-600">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Connection Successful!</h2>
          <p className="text-gray-600">{message}</p>
          <p className="text-gray-500 text-sm mt-4">Redirecting you back...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Connection Failed</h2>
          <p className="text-gray-600">{message}</p>
          <button 
            onClick={() => router.push('/dashboard/stripe-connect')}
            className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4c22cc] transition font-bold"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  )
}

// Componente di caricamento per il Suspense
function LoadingStripeRedirect() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
    </div>
  )
}

export default function StripeRedirect() {
  return (
    <ProtectedRoute>
      <Layout title="Stripe Connection - Guestify">
        <Suspense fallback={<LoadingStripeRedirect />}>
          <StripeRedirectContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
} 