'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type PlanType = 'monthly' | 'yearly';

interface SubscriptionPlansProps {
  userHasActiveSubscription?: boolean;
}

export default function SubscriptionPlans({ userHasActiveSubscription = false }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<PlanType | null>(null);
  const router = useRouter();

  // Price values from README
  const monthlyPrice = '€9,90';
  const yearlyPrice = '€99,90';
  const trialDays = 7;

  const handleSubscribe = async (planType: PlanType) => {
    try {
      setLoading(planType);
      
      const response = await fetch('/api/stripe/paywall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del pagamento');
      }
      
      // Redirect to the payment link
      window.location.href = data.url;
    } catch (error) {
      console.error('Errore:', error);
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Piani di abbonamento
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Scegli il piano più adatto alle tue esigenze
        </p>
        
        {userHasActiveSubscription && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
            Hai già un abbonamento attivo.
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Piano Mensile */}
        <div className="border rounded-lg shadow-sm p-6 bg-white">
          <h3 className="text-2xl font-bold text-gray-900">Piano Mensile</h3>
          <p className="mt-4 text-gray-600">
            Accesso a tutte le funzionalità per un mese.
          </p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">{monthlyPrice}</span>
            <span className="text-base font-medium text-gray-500">/mese</span>
          </p>
          <div className="mt-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Gestione illimitata delle proprietà</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Servizi extra personalizzabili</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Prova gratuita di {trialDays} giorni</p>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly' || userHasActiveSubscription}
              className={`w-full bg-[#5E2BFF] hover:bg-[#4a22cc] text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] transition-colors ${
                (loading === 'monthly' || userHasActiveSubscription) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading === 'monthly' ? 'Caricamento...' : userHasActiveSubscription ? 'Già abbonato' : 'Inizia ora'}
            </button>
          </div>
        </div>

        {/* Piano Annuale */}
        <div className="border rounded-lg shadow-sm p-6 bg-white border-[#5E2BFF]">
          <div className="absolute inset-0 -mt-2 -mr-2">
            <div className="inline-flex rounded-full bg-[#ffde59] text-black px-3 py-1 text-xs font-medium transform translate-x-1/2 -translate-y-1/2 absolute right-0 top-0">
              Consigliato
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Piano Annuale</h3>
          <p className="mt-4 text-gray-600">
            Accesso a tutte le funzionalità per un anno intero.
          </p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">{yearlyPrice}</span>
            <span className="text-base font-medium text-gray-500">/anno</span>
          </p>
          <div className="mt-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Gestione illimitata delle proprietà</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Servizi extra personalizzabili</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Prova gratuita di {trialDays} giorni</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700 font-bold">Risparmia il 16% rispetto al piano mensile</p>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly' || userHasActiveSubscription}
              className={`w-full bg-[#5E2BFF] hover:bg-[#4a22cc] text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] transition-colors ${
                (loading === 'yearly' || userHasActiveSubscription) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading === 'yearly' ? 'Caricamento...' : userHasActiveSubscription ? 'Già abbonato' : 'Inizia ora'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center">
        <p className="text-gray-600">
          Tutti i piani includono una prova gratuita di {trialDays} giorni. Puoi annullare in qualsiasi momento.
        </p>
      </div>
    </div>
  );
} 