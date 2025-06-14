'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import SessionManager from '@/components/SessionManager'
import { Toaster } from 'react-hot-toast'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SessionManager>
        <CartProvider>
          {children}
          <Toaster position="top-center" />
        </CartProvider>
      </SessionManager>
    </AuthProvider>
  )
}