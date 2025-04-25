'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Toaster } from 'react-hot-toast'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster position="top-center" />
      </CartProvider>
    </AuthProvider>
  )
}