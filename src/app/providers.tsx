'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" />
    </AuthProvider>
  )
}