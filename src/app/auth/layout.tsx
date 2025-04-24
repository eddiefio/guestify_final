'use client'

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/">
              <Image 
                src="/logo_guest.png" 
                alt="Guestify Logo" 
                width={200} 
                height={200} 
                className="mx-auto"
              />
            </Link>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            La piattaforma per gli host di affitti brevi
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {children}
          </div>
        </div>
        <Toaster position="top-center" />
      </div>
    </AuthProvider>
  )
}