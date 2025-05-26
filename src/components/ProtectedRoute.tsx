'use client'

import { useEffect, ReactNode, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { SubscriptionStatus } from '@/utils/enums'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, subscriptionInfo, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  useLayoutEffect(() => {
    if (subscriptionInfo && !user?.user_metadata.is_staff) {
      const { status } = subscriptionInfo;
      const {
        ACTIVE,
        PENDING,
        TRIALING,
        UNPAID,
        CANCELLED,
      } = SubscriptionStatus
      const redirectUrl = status === CANCELLED ? '/dashboard/subscription' : status === PENDING || status === UNPAID ? "/dashboard/profile" : null;
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  }, [subscriptionInfo, user]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}