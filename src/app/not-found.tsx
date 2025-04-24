'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-[#5E2BFF] mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-block bg-[#5E2BFF] text-white px-6 py-2 rounded-md hover:bg-[#4518cc] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
} 