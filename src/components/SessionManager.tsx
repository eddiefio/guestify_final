'use client'

import { useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface SessionManagerProps {
  children: ReactNode
}

export default function SessionManager({ children }: SessionManagerProps) {
  const { isLoading, refreshSession } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    // Skip session management for public auth pages
    const publicPaths = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/error']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    if (isPublicPath) {
      return
    }

    let syncInterval: NodeJS.Timeout | null = null
    let lastSyncTime = Date.now()

    // Function to sync session state
    const syncSession = async () => {
      const now = Date.now()
      // Prevent too frequent syncs (minimum 30 seconds between syncs)
      if (now - lastSyncTime < 30000) {
        return
      }
      
      lastSyncTime = now
      console.log('Syncing session state...')
      
      try {
        await refreshSession(false)
      } catch (error) {
        console.error('Error syncing session:', error)
      }
    }

    // Handle page visibility changes with debouncing
    let visibilityTimeout: NodeJS.Timeout | null = null
    
    const handleVisibilityChange = () => {
      // Clear any existing timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout)
      }

      if (!document.hidden) {
        // Debounce the sync to avoid multiple rapid calls
        visibilityTimeout = setTimeout(() => {
          syncSession()
        }, 500) // Wait 500ms after tab becomes visible
      }
    }

    // Handle online/offline events
    const handleOnline = () => {
      console.log('Connection restored, syncing session...')
      syncSession()
    }

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    
    // Set up periodic sync (every 5 minutes)
    syncInterval = setInterval(() => {
      if (!document.hidden) {
        syncSession()
      }
    }, 300000) // 5 minutes

    // Initial sync on mount (delayed to avoid conflicts with AuthContext initialization)
    const initialSyncTimeout = setTimeout(() => {
      if (!document.hidden) {
        syncSession()
      }
    }, 1000)

    // Cleanup
    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout)
      }
      if (syncInterval) {
        clearInterval(syncInterval)
      }
      clearTimeout(initialSyncTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [pathname, refreshSession])

  // Show a loading overlay when the app is in a loading state
  if (isLoading && pathname.startsWith('/dashboard')) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-gray-700">Sincronizzazione sessione...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  return <>{children}</>
}