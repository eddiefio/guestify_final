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
              <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-[#5E2BFF] to-[#FFDE59] rounded-full">
                <span className="text-white text-2xl font-bold">Guestify</span>
              </div>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Guestify
          </h2>
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