'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { resetPassword, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Reindirizza se già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (isLoading) return
    
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore durante la richiesta di reset della password')
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center">
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Abbiamo inviato un'email con le istruzioni per reimpostare la password.
            <br />
            Controlla la tua casella di posta.
          </div>
          
          <Link 
            href="/auth/signin" 
            className="inline-block mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Torna al login
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Invio in corso...' : 'Invia istruzioni'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Ricordi la password?{' '}
              <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
                Torna al login
              </Link>
            </p>
          </div>
        </>
      )}
    </>
  )
}