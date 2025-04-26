'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      setError('Per favore inserisci la tua email');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ottieni l'URL base
      const baseUrl = window.location.origin;
      
      // Genera URL di callback con parametri espliciti per il tipo di recupero
      const callbackUrl = `${baseUrl}/auth/callback?type=recovery`;
      
      console.log('URL di callback:', callbackUrl);
      
      // Invia email di reset password
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Errore durante l\'invio dell\'email di recupero:', error);
      setError(error.message || 'Si è verificato un errore durante l\'invio dell\'email di recupero');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-gray-600">
          Enter your email to receive a recovery link
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            We have sent a recovery link to {email}.
            Please check your email and follow the instructions to reset your password.
            </div>
            <Link 
              href="/auth/signin"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Return to Login Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="nome@esempio.it"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
              >
                {loading ? 'Invio in corso...' : 'Invia link di recupero'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link 
                href="/auth/login" 
                className="text-indigo-600 hover:text-indigo-500"
              >
                Return to Login Page
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}