'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

type StripeAccountStatus = {
  hasStripeAccount: boolean;
  isEnabled: boolean;
  requiresSetup: boolean;
  accountId?: string;
};

export default function StripeConnectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  // Verifica lo stato quando la pagina viene caricata o quando searchParams cambia
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/stripe/status');
        
        if (response.ok) {
          const data = await response.json();
          setAccountStatus(data);
          
          // Se l'account è abilitato e l'utente ha completato l'onboarding, reindirizza alla dashboard
          if (data.isEnabled && searchParams.get('success') === 'true') {
            toast.success('Your Stripe account is now connected!');
            // Attendere un po' prima di reindirizzare
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
          
          // Se il link è scaduto, crea un nuovo link
          if (searchParams.get('refresh') === 'true') {
            handleConnectStripe();
          }
        } else {
          toast.error('Failed to check Stripe account status');
        }
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        toast.error('An error occurred while checking your account status');
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [searchParams, router]);

  const handleConnectStripe = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        // Reindirizza l'utente all'URL di onboarding di Stripe
        window.location.href = url;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to connect with Stripe');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('An error occurred while connecting to Stripe');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Connect to Stripe</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Accept Payments with Stripe</h2>
        
        <p className="mb-6 text-gray-600">
          To offer extra services to your guests, you need to connect your Stripe account. 
          This allows you to receive payments directly to your bank account.
        </p>
        
        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : accountStatus?.isEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Your Stripe account is connected</h3>
                <p className="mt-2 text-sm text-green-700">
                  You can now add and manage extra services for your properties.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Stripe account not connected</h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    You need to connect a Stripe account to offer extra services and receive payments.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold">What you'll need:</h3>
                <ul className="mt-2 ml-6 list-disc text-gray-600">
                  <li>Your bank account information</li>
                  <li>Your personal or business information</li>
                  <li>A valid form of identification</li>
                </ul>
              </div>
              
              <button
                onClick={handleConnectStripe}
                disabled={isRedirecting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#635BFF] hover:bg-[#635BFF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] disabled:opacity-70"
              >
                {isRedirecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Connect with Stripe'
                )}
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-3">About Stripe</h3>
        <p className="text-gray-600 mb-4">
          Stripe is a secure payment platform that helps you accept payments and send money. Guestify uses Stripe to process payments between you and your guests.
        </p>
        <div className="flex items-center">
          <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-600">Stripe uses bank-level security to keep your information safe</span>
        </div>
      </div>
    </div>
  );
} 