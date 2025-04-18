'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function DashboardClient() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()
  const [userName, setUserName] = useState<string>('')
  const router = useRouter()

  // Protezione della rotta: reindirizza se non autenticato
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  // Ottieni il nome dell'utente
  useEffect(() => {
    if (user) {
      // Prova a ottenere il nome dai metadati dell'utente
      const metadata = user.user_metadata
      if (metadata && metadata.name) {
        setUserName(metadata.name)
      } else {
        // Altrimenti usa l'email
        setUserName(user.email?.split('@')[0] || 'Utente')
      }
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      toast.error('Errore durante il logout')
    }
  }

  // Mostra un loader mentre verifica l'autenticazione
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4">Benvenuto, {userName}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Le tue proprietà</h2>
          <p className="text-gray-600 mb-4">
            Non hai ancora aggiunto nessuna proprietà. Inizia aggiungendo la tua prima proprietà.
          </p>
          <button
            onClick={() => toast.success('Funzionalità in arrivo!')}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Aggiungi proprietà
          </button>
        </div>
      </main>
    </div>
  )
}