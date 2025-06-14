'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// Definizione del tipo per il contesto di autenticazione
type AuthContextType = {
  user: User | null
  // subscriptionInfo: any;
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  subscriptionInfo: any | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name: string, country: string) => Promise<any>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshSession: (forceRefresh?: boolean) => Promise<boolean>
  signInWithGoogle: () => Promise<any>
}

// Creazione del contesto
const AuthContext = createContext<AuthContextType | null>(null)

// Provider che gestisce lo stato dell'autenticazione
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(0)
  const router = useRouter()

  const fetchUserDetails = async (userInfo: User) => {
    try {
      const userId = userInfo.id as string
      if (!userId) {
        console.warn('No user ID found in session:', userId)
        setUser(null)
        return null
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_staff')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        console.warn('No user details found for session user:', userId, error)
        setUser(userInfo)
      }

      setUser({
        ...userInfo,
        user_metadata: {
          ...userInfo.user_metadata,
          is_staff: data.is_staff || false, // Aggiungi is_staff se esiste
        }
      })

    } catch (err) {
      console.error('Unexpected error fetching user details:', err)
      setUser(null)
      return null
    }
  }

  const fetchSubscriptionInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, plan_type, status, created_at, trial_start, trial_end, current_period_end, current_period_start, canceled_at, trial_remaining_days, trial_consumed')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) // Optional: latest first
        .limit(1) // Only the latest
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
        setSubscriptionInfo(null)
        return
      }

      setSubscriptionInfo(data)
    } catch (err) {
      console.error('Unexpected error fetching subscription:', err)
      setSubscriptionInfo(null)
    }
  }

  // Funzione per verificare e aggiornare la sessione
  const refreshSession = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      console.log('Refreshing auth session...')

      // Tenta il refresh tramite API - ora dovrebbe funzionare
      try {
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })

        if (response.ok) {
          const { session: apiSession, error: apiError } = await response.json()
          
          if (apiSession && !apiError) {
            console.log('Session refreshed via API')
            setSession(apiSession)
            await fetchUserDetails(apiSession.user)
            setIsLoading(false)
            return true
          } else if (apiError) {
            console.log('API returned error:', apiError)
            // Continue to fallback method
          }
        } else {
          console.log('API response not ok:', response.status)
        }
      } catch (err) {
        console.error('Error refreshing via API:', err)
        // Continue to fallback method
      }

      // Usa il metodo standard client come fallback
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        setSession(null)
        setUser(null)
        setSubscriptionInfo(null)
        setIsLoading(false)
        return false
      }

      if (data.session) {
        console.log('Session found via client')
        setSession(data.session)
        await fetchUserDetails(data.session.user)
        setIsLoading(false)
        return true
      } else {
        console.log('No session found')
        setSession(null)
        setUser(null)
        setSubscriptionInfo(null)
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Exception in refreshSession:', err)
      setSession(null)
      setUser(null)
      setSubscriptionInfo(null)
      setIsLoading(false)
      return false
    }
  }

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
      await fetchUserDetails(data.session.user)

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

  // Funzione per il login con Google
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }
      setSession(data.session)
      await fetchUserDetails(data.session.user)
      toast.success('Login with Google successful!')
      return data
    } catch (err: any) {
      console.error('Errore nell\'accesso con Google:', err)
      toast.error(`Errore: ${err.message || 'Accesso con Google fallito'}`)
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
    signInWithGoogle,
    subscriptionInfo,
  }

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
            await fetchUserDetails(newSession.user)
            setIsLoading(false)
          } else if (event === 'SIGNED_OUT') {
            setSession(null)
            setUser(null)
            setSubscriptionInfo(null)
            setIsLoading(false)
          } else if (event === 'TOKEN_REFRESHED' && newSession) {
            setSession(newSession)
            await fetchUserDetails(newSession.user)
          }
        }
      )

      return () => {
        authListener?.subscription.unsubscribe()
      }
    } catch (err) {
      console.error('Error in auth initialization:', err)
      setSession(null)
      setUser(null)
      setSubscriptionInfo(null)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }

  // Inizializzazione e setup degli handler di autenticazione
  useEffect(() => {
    if (isInitialized) return
    initAuth()
  }, [isInitialized])

  // Configura un timer per verificare e aggiornare periodicamente la sessione
  useEffect(() => {
    if (!session) return

    // Controlla ogni 5 minuti se la sessione deve essere aggiornata
    const interval = setInterval(async () => {
      if (!session || isLoading) return

      // Se mancano meno di 10 minuti alla scadenza
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = expiresAt ? expiresAt - now : 0

      if (timeLeft < 600 && timeLeft > 0) {
        console.log('Session expiring soon, refreshing...')
        await refreshSession(true)
      } else if (timeLeft <= 0) {
        console.log('Session expired, signing out...')
        setSession(null)
        setUser(null)
        setSubscriptionInfo(null)
        setIsLoading(false)
      }
    }, 300000) // Ogni 5 minuti

    return () => clearInterval(interval)
  }, [session, isLoading])

  useEffect(() => {
    if (user && !user?.user_metadata.is_staff) {
      fetchSubscriptionInfo(user.id as string) // Fetch subscription info
    }
  }, [user])


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