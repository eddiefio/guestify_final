'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useSessionSync() {
  const { refreshSession } = useAuth()
  const lastSyncRef = useRef<number>(Date.now())
  const isSyncingRef = useRef<boolean>(false)

  useEffect(() => {
    const syncSession = async () => {
      // Prevent concurrent syncs
      if (isSyncingRef.current) {
        return
      }

      const now = Date.now()
      const timeSinceLastSync = now - lastSyncRef.current

      // Only sync if more than 30 seconds have passed
      if (timeSinceLastSync < 30000) {
        return
      }

      isSyncingRef.current = true
      lastSyncRef.current = now

      try {
        await refreshSession(false)
      } catch (error) {
        console.error('Session sync error:', error)
      } finally {
        isSyncingRef.current = false
      }
    }

    // Sync on mount
    syncSession()

    // Sync when window regains focus
    const handleFocus = () => {
      syncSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshSession])
}