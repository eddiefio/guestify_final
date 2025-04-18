'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updatePassword, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verifica se l'utente è arrivato qui tramite un link di reset
  useEffect(() => {
    // Se non c'è un token nella URL, reindirizza alla pagina di login
    if (!searchParams?.has('token')) {
      router.push('/auth/signin')
    }
  }, [searchParams, router])

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
    
    // Validazione
    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }
    
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }
    
    try {
      const { error } = await updatePassword(password)
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
      
      // Reindirizza dopo un breve ritardo
      setTimeout(() => {
        router.push('/auth/signin?reset_success=true')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore durante l\'aggiornamento della password')
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-center">Imposta nuova password</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center">
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Password aggiornata con successo!
            <br />
            Verrai reindirizzato alla pagina di login...
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Inserisci la tua nuova password.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nuova Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Conferma Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? 'Aggiornamento in corso...' : 'Aggiorna password'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
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