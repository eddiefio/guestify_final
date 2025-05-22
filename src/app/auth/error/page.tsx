'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// Componente client che utilizza useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Si è verificato un errore durante l\'autenticazione';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
        </div>

        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>

        <div className="flex flex-col space-y-4 text-center">
          <p className="text-gray-600">
            You can try one of the following options:
          </p>

          <div>
            <Link
              href="/auth/sigin"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Back to login page
            </Link>
          </div>

          <div>
            <Link
              href="/auth/forgot-password"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Reset your password
            </Link>
          </div>

          <div>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principale avvolto in Suspense
export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
            <p className="mt-4">Loading error details...</p>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}