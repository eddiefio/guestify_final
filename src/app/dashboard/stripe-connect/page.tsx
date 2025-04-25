'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import toast from 'react-hot-toast'

// Componente che utilizza useSearchParams
function StripeConnectContent() {
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Get the redirect URL from query params
  const redirectUrl = searchParams?.get('redirect') || '/dashboard'

  // Check if the user already has an active Stripe account
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) return
      
      try {
        // Check if user already has a Stripe account
        const { data: stripeAccount, error } = await supabase
          .from('host_stripe_accounts')
          .select('stripe_account_id, stripe_account_status')
          .eq('host_id', user.id)
          .single()
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking Stripe account:', error)
          toast.error('Failed to check your Stripe account status')
        }
        
        // If user has an active Stripe account, redirect to the destination page
        if (stripeAccount && stripeAccount.stripe_account_status === 'active') {
          console.log('User already has an active Stripe account, redirecting')
          router.push(redirectUrl)
          return
        }
        
        // If user has a pending account, show appropriate message
        if (stripeAccount && stripeAccount.stripe_account_status === 'pending') {
          setError('Your Stripe account setup is incomplete. Please complete the setup to start offering extra services.')
        }
      } catch (err) {
        console.error('Error in checkStripeStatus:', err)
      } finally {
        setCheckingStatus(false)
      }
    }
    
    checkStripeStatus()
  }, [user, router, redirectUrl])

  // Store the redirect URL in localStorage to use it after Stripe redirect
  useEffect(() => {
    if (redirectUrl) {
      localStorage.setItem('stripe-connect-return-url', redirectUrl)
    }
  }, [redirectUrl])

  // Handle the connection to Stripe
  const handleConnect = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe')
      }
      
      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (err: any) {
      console.error('Error connecting to Stripe:', err)
      setError(err.message || 'An error occurred while connecting to Stripe')
      toast.error('Failed to connect with Stripe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Skip stripe connection and continue to the next page
  const handleSkip = () => {
    toast.success('You can connect Stripe later from your dashboard')
    router.push(redirectUrl)
  }

  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md mt-10 font-spartan">
      <div className="text-center mb-8">
        <Image 
          src="/images/stripe-logo.png" 
          alt="Stripe Logo" 
          width={180} 
          height={70}
          className="mx-auto mb-6"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Connect Your Stripe Account</h2>
        <p className="text-gray-600">
          To receive payments from your guests for extra services, you need to connect your Stripe account.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-gray-50 p-5 rounded-lg mb-6">
        <h3 className="font-bold text-gray-800 mb-2">What happens when you connect:</h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>You'll receive payments directly to your bank account</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>You can offer extra services to your guests</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Stripe handles all payment processing securely</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col space-y-4">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="bg-[#5E2BFF] text-white py-3 px-6 rounded-lg hover:bg-[#4c22cc] transition duration-200 font-bold disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect with Stripe'
          )}
        </button>
        
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip for now
          </button>
          <p className="text-xs text-gray-400 mt-1">
            You can connect Stripe later from your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente di caricamento per il Suspense
function LoadingStripeConnect() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
    </div>
  )
}

export default function StripeConnect() {
  return (
    <ProtectedRoute>
      <Layout title="Connect Stripe - Guestify">
        <Suspense fallback={<LoadingStripeConnect />}>
          <StripeConnectContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
} 