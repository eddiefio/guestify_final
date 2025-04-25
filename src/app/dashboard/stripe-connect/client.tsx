'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

// Tipo per lo status dell'account Stripe
type StripeAccountStatus = 'not_connected' | 'pending' | 'active' | 'error'

// Tipo per i dati dell'account Stripe
interface StripeAccount {
  id: string
  host_id: string
  stripe_account_id: string
  stripe_account_status: StripeAccountStatus
  created_at: string
  connected_at?: string
}

export default function StripeConnectClient() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingButton, setLoadingButton] = useState(false)
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Estrai il parametro di redirect dall'URL, se presente
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectUrl(redirect)
    }
  }, [])

  // Reindirizza alla pagina desiderata se l'account è attivo e c'è un URL di redirect
  useEffect(() => {
    if (stripeAccount?.stripe_account_status === 'active' && redirectUrl) {
      router.push(redirectUrl)
    }
  }, [stripeAccount, redirectUrl, router])

  // Recupera informazioni sull'account Stripe dell'host
  useEffect(() => {
    if (!user) return
    
    const fetchStripeAccount = async () => {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('host_stripe_accounts')
          .select('*')
          .eq('host_id', user.id)
          .maybeSingle()
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching Stripe account:', error)
          toast.error('Error loading your Stripe account information')
        } else if (data) {
          setStripeAccount(data)
        } else {
          // Nessun account trovato, ma non è un errore
          console.log('Nessun account Stripe trovato per questo utente')
          // Lasciamo stripeAccount come null, che indica che l'utente non è connesso
        }
      } catch (error) {
        console.error('Error in fetchStripeAccount:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStripeAccount()
  }, [user])

  // Funzione per iniziare il processo di connessione con Stripe
  const handleConnectStripe = async () => {
    if (!user) return
    
    try {
      setLoadingButton(true)
      
      // Costruisci l'URL della richiesta
      const url = '/api/stripe/create-account-link';
      
      // Prepara i dati con il redirect se presente
      const requestData = redirectUrl ? { redirectUrl } : {};
      
      // Chiamata all'API per iniziare il processo di onboarding
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error connecting to Stripe')
      }
      
      const { url: stripeUrl } = await response.json()
      
      // Reindirizza l'utente al flow di onboarding di Stripe
      window.location.href = stripeUrl
    } catch (error: any) {
      console.error('Error connecting to Stripe:', error)
      toast.error(error.message || 'Error connecting to Stripe')
      setLoadingButton(false)
    }
  }

  // Renderizza lo stato dell'account in base allo status
  const renderAccountStatus = () => {
    if (!stripeAccount) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-8">
          <h3 className="text-lg font-bold mb-2">Not Connected</h3>
          <p className="mb-4">
            You need to connect a Stripe account to receive payments from your guests.
            This allows you to offer extra services and manage payments directly.
          </p>
          <button
            onClick={handleConnectStripe}
            disabled={loadingButton}
            className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg hover:bg-[#4719d1] transition font-bold shadow-sm flex items-center justify-center"
          >
            {loadingButton ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6.16667C2 4.97005 2.97005 4 4.16667 4H19.8333C21.03 4 22 4.97005 22 6.16667V17.8333C22 19.03 21.03 20 19.8333 20H4.16667C2.97005 20 2 19.03 2 17.8333V6.16667Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16.2499V16.2499M8.25 10.6666V13.9999M12 7.33325V13.9999M15.75 9.24992V13.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Connect with Stripe
              </>
            )}
          </button>
        </div>
      )
    }

    switch (stripeAccount.stripe_account_status) {
      case 'active':
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-8">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h3 className="text-lg font-bold">Connected to Stripe</h3>
            </div>
            <p className="mb-4">
              Your Stripe account is successfully connected. You can now receive payments for your extra services.
            </p>
            <div className="flex items-center text-sm font-medium">
              <span className="mr-2">Account ID:</span>
              <span className="font-mono bg-green-100 px-2 py-1 rounded">{stripeAccount.stripe_account_id}</span>
            </div>
          </div>
        )
      
      case 'pending':
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 mb-8">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <h3 className="text-lg font-bold">Stripe Account Pending</h3>
            </div>
            <p className="mb-4">
              Your Stripe account is in the process of being verified. This usually takes a few minutes, but can sometimes take longer.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={loadingButton}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold shadow-sm text-sm"
            >
              {loadingButton ? 'Processing...' : 'Complete Verification'}
            </button>
          </div>
        )
      
      case 'error':
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-8">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-lg font-bold">Connection Error</h3>
            </div>
            <p className="mb-4">
              There was an error with your Stripe account connection. Please try connecting again.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={loadingButton}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-bold shadow-sm"
            >
              {loadingButton ? 'Processing...' : 'Try Again'}
            </button>
          </div>
        )
      
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-8">
            <h3 className="text-lg font-bold mb-2">Not Connected</h3>
            <p className="mb-4">
              You need to connect a Stripe account to receive payments from your guests.
              This allows you to offer extra services and manage payments directly.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={loadingButton}
              className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg hover:bg-[#4719d1] transition font-bold shadow-sm flex items-center justify-center"
            >
              {loadingButton ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6.16667C2 4.97005 2.97005 4 4.16667 4H19.8333C21.03 4 22 4.97005 22 6.16667V17.8333C22 19.03 21.03 20 19.8333 20H4.16667C2.97005 20 2 19.03 2 17.8333V6.16667Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 16.2499V16.2499M8.25 10.6666V13.9999M12 7.33325V13.9999M15.75 9.24992V13.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Connect with Stripe
                </>
              )}
            </button>
          </div>
        )
    }
  }

  return (
    <ProtectedRoute>
      <Layout title="Connect Stripe - Guestify">
        <div className="container mx-auto px-4 pt-1 pb-6 font-spartan">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#5E2BFF]">Stripe Connection</h1>
              <Link href="/dashboard">
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  Back to Dashboard
                </button>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2BFF]"></div>
              </div>
            ) : (
              <>
                {renderAccountStatus()}
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h2 className="text-xl font-bold mb-4">Why Connect with Stripe?</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#5E2BFF] text-white flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg">Receive Payments</h3>
                      </div>
                      <p className="text-gray-600">
                        Offer extra services to your guests and receive payments directly to your bank account.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#5E2BFF] text-white flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg">Secure Transactions</h3>
                      </div>
                      <p className="text-gray-600">
                        Stripe provides a secure platform for handling credit card payments with fraud prevention.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#5E2BFF] text-white flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg">Multiple Payment Methods</h3>
                      </div>
                      <p className="text-gray-600">
                        Accept payments from guests using various payment methods from around the world.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#5E2BFF] text-white flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg">Financial Reporting</h3>
                      </div>
                      <p className="text-gray-600">
                        Access detailed reports of your transaction history and financial performance.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-lg mb-3">How it works</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                      <li>Connect your Stripe account (or create a new one) by clicking the button above.</li>
                      <li>Complete the Stripe verification process by providing the required information.</li>
                      <li>Once verified, you can immediately start offering paid extra services to your guests.</li>
                      <li>Funds will be deposited directly to your bank account according to Stripe's payout schedule.</li>
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 