'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  // Reindirizza alla pagina di login dopo un breve ritardo
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/signin')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[#5E2BFF] to-[#FFDE59] rounded-full">
          <span className="text-white text-4xl font-bold">Guestify</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Guestify</h1>
        <p className="text-xl text-gray-600 mb-8">
          La piattaforma per gli host di affitti brevi
        </p>
        
        <div className="animate-pulse text-indigo-600 mb-6">
          Reindirizzamento in corso...
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Accedi
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
          >
            Registrati
          </Link>
        </div>
      </div>
    </div>
  )
}
