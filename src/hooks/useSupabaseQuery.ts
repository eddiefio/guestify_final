'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, resetSupabaseConnection } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UseSupabaseQueryOptions {
  enabled?: boolean
  retryCount?: number
  retryDelay?: number
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

interface UseSupabaseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  reset: () => void
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const {
    enabled = true,
    retryCount = 3,
    retryDelay = 1000,
    refetchOnWindowFocus = true,
    staleTime = 5 * 60 * 1000 // 5 minuti
  } = options

  const { user, refreshSession, retryWithExponentialBackoff } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTime = useRef<number>(0)
  const isMounted = useRef(true)

  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!enabled || (!user && !isRefetch)) return

    // Throttle requests se non è un refetch forzato
    const now = Date.now()
    if (!isRefetch && now - lastFetchTime.current < 1000) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      lastFetchTime.current = now

      const result = await retryWithExponentialBackoff(async () => {
        try {
          return await queryFn()
        } catch (err: any) {
          // Se l'errore è di autenticazione, prova a refreshare la sessione
          if (err.message?.includes('JWT') || err.message?.includes('refresh_token') || err.code === 'PGRST301') {
            console.log('Auth error detected, attempting session refresh...')
            const refreshed = await refreshSession(true)
            if (refreshed) {
              // Riprova la query dopo il refresh
              return await queryFn()
            } else {
              throw new Error('Session refresh failed')
            }
          }
          
          // Se l'errore è di rete, prova a resettare la connessione
          if (err.message?.includes('network') || err.message?.includes('fetch')) {
            console.log('Network error detected, resetting Supabase connection...')
            resetSupabaseConnection()
          }
          
          throw err
        }
      }, retryCount)

      if (isMounted.current) {
        setData(result)
        setError(null)
      }
    } catch (err: any) {
      console.error('Query failed after retries:', err)
      if (isMounted.current) {
        setError(err.message || 'Query failed')
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [enabled, user, queryFn, retryCount, refreshSession, retryWithExponentialBackoff])

  const refetch = useCallback(async () => {
    await executeQuery(true)
  }, [executeQuery])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  // Execute query when dependencies change
  useEffect(() => {
    if (enabled) {
      executeQuery()
    }
  }, [enabled, ...dependencies])

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const now = Date.now()
      // Solo refetch se i dati sono "stale"
      if (data && now - lastFetchTime.current > staleTime) {
        executeQuery(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, staleTime, data, executeQuery])

  // Cleanup
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    reset
  }
}

// Hook specifico per le properties con cache e gestione ottimizzata
export function useProperties() {
  const { user } = useAuth()
  
  return useSupabaseQuery(
    async () => {
      if (!user) throw new Error('No user found')
      
      // Fetch properties
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch additional data for properties
      if (properties && properties.length > 0) {
        const propertiesWithData = await Promise.all(
          properties.map(async (property: any) => {
            try {
              // Check if property has wifi credentials
              const { count: wifiCount } = await supabase
                .from('wifi_credentials')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', property.id)
              
              // Check if property has how things work guides
              const { count: howThingsCount } = await supabase
                .from('how_things_work')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', property.id)
              
              return {
                ...property,
                has_wifi: wifiCount ? wifiCount > 0 : false,
                has_how_things_work: howThingsCount ? howThingsCount > 0 : false
              }
            } catch (propertyError) {
              console.error(`Error fetching data for property ${property.id}:`, propertyError)
              // Return property without additional data on error
              return {
                ...property,
                has_wifi: false,
                has_how_things_work: false
              }
            }
          })
        )
        
        return propertiesWithData
      } else {
        return []
      }
    },
    [user?.id],
    {
      enabled: !!user,
      refetchOnWindowFocus: true,
      staleTime: 2 * 60 * 1000, // 2 minuti per le properties
    }
  )
}