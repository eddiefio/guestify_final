'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// Definizione del tipo per il contesto di autenticazione
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name: string, country: string) => Promise<any>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshSession: (forceRefresh?: boolean) => Promise<boolean>
}

// Creazione del contesto
const AuthContext = createContext<AuthContextType | null>(null)

// Provider che gestisce lo stato dell'autenticazione
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Funzione per verificare e aggiornare la sessione
  const refreshSession = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      console.log('Refreshing auth session...')

      // Tenta il refresh tramite API - metodo più affidabile
      try {
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to refresh token')
        }

        const data = await response.json()
        const apiSession = data.session
        setSession(apiSession)
        setUser(apiSession.user)
        setIsLoading(false)
        return true
      } catch (apiError) {
        console.error('Error refreshing via API:', apiError)
        // Continua con l'approccio Admin
      }

      // Usa il metodo standard client come fallback
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        setSession(null)
        setUser(null)
        setIsLoading(false)
        return false
      }

      if (data.session) {
        console.log('Session found via client')
        setSession(data.session)
        setUser(data.session.user)
        setIsLoading(false)
        return true
      } else {
        console.log('No session found')
        setSession(null)
        setUser(null)
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Exception in refreshSession:', err)
      setSession(null)
      setUser(null)
      setIsLoading(false)
      return false
    }
  }

  // Inizializzazione e setup degli handler di autenticazione
  useEffect(() => {
    if (isInitialized) return

    const initAuth = async () => {
      try {
        // Tenta di ottenere la sessione corrente
        await refreshSession()

        // Configura l'ascoltatore per i cambiamenti di autenticazione
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event: string, newSession: Session | null) => {
            console.log('Auth state changed:', event)
            
            if (event === 'SIGNED_IN' && newSession) {
              setSession(newSession)
              setUser(newSession.user)
            } else if (event === 'SIGNED_OUT') {
              setSession(null)
              setUser(null)
            }
          }
        )

        return () => {
          authListener?.subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Error in auth initialization:', err)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [isInitialized])

  // Configura un timer per verificare e aggiornare periodicamente la sessione
  useEffect(() => {
    // Controlla ogni 5 minuti se la sessione deve essere aggiornata
    const interval = setInterval(async () => {
      if (!session) return

      // Se mancano meno di 10 minuti alla scadenza
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = expiresAt ? expiresAt - now : 0

      if (timeLeft < 600) {
        console.log('Session expiring soon, refreshing...')
        refreshSession(true)
      }
    }, 300000) // Ogni 5 minuti

    return () => clearInterval(interval)
  }, [session])

  // Funzione di login
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Puliamo anche localStorage e sessionStorage
      localStorage.removeItem('supabase-auth-v2')
      sessionStorage.removeItem('supabase-session')

      // Tentativo di login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.user)
      toast.success('Login successful!')

      return data
    } catch (err: any) {
      console.error('Error in login:', err)
      toast.error(`Error: ${err.message || 'Login failed'}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione di registrazione
  const signUp = async (email: string, password: string, name: string, country: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Registrazione con Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, country },
          emailRedirectTo: `${window.location.origin}/auth/signin?confirmed=true`
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Crea record profilo nel database
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email,
            full_name: name
          }
        ])

        // Imposta flag per mostrare messaggio di conferma email
        localStorage.setItem('showConfirmEmailMessage', 'true')

        // IMPORTANTE: Disconnetti l'utente per prevenire il login automatico
        await supabase.auth.signOut()

        toast.success('Account created successfully! Check your email to confirm your account.')
        console.log('Registration completed successfully, redirecting to signin...')

        // Reindirizza alla pagina di login con parametro dopo un breve ritardo
        setTimeout(() => {
          router.push('/auth/signin?newRegistration=true')
        }, 2000)

        return { success: true }
      }
    } catch (err: any) {
      console.error('Error in signup:', err)
      toast.error(`Error: ${err.message || 'Failed to sign up'}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione di logout
  const signOut = async () => {
    try {
      setIsLoading(true)

      // Prima mostriamo il toast di successo
      toast.success('Logged out successfully')

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Aggiungiamo un ritardo prima di completare l'operazione
      // Questo permette alle animazioni di completarsi correttamente su mobile
      setTimeout(() => {
        setIsLoading(false)
        // Reindirizzamento gestito altrove nei componenti
      }, 300)

      return { error: null }
    } catch (err) {
      console.error('Error in logout:', err)
      toast.error(`Error: ${(err as any).message || 'Could not log out'}`)
      setIsLoading(false)
      return { error: err }
    }
  }

  // Funzione per richiedere il reset della password
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      toast.success('Password reset instructions sent to your email')
      return { error: null }
    } catch (err) {
      console.error('Error requesting password reset:', err)
      toast.error(`Error: ${(err as any).message || 'Failed to request password reset'}`)
      return { error: err }
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per aggiornare la password
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      toast.success('Password updated successfully')
      return { error: null }
    } catch (err) {
      console.error('Error updating password:', err)
      toast.error(`Error: ${(err as any).message || 'Failed to update password'}`)
      return { error: err }
    } finally {
      setIsLoading(false)
    }
  }

  // Valore da fornire tramite il context
  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook per utilizzare l'auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export default del contesto
export default AuthContext