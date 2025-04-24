'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { TranslationProvider } from '@/contexts/TranslationContext'
import { Toaster } from 'react-hot-toast'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <TranslationProvider>
        {children}
        <Toaster position="top-center" />
      </TranslationProvider>
    </AuthProvider>
  )
}