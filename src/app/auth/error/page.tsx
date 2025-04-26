'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Si è verificato un errore durante l\'autenticazione';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Errore di Autenticazione</h1>
        </div>
        
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
        
        <div className="flex flex-col space-y-4 text-center">
          <p className="text-gray-600">
            Puoi provare una delle seguenti opzioni:
          </p>
          
          <div>
            <Link 
              href="/auth/login" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Torna alla pagina di login
            </Link>
          </div>
          
          <div>
            <Link 
              href="/auth/forgot-password" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Recupera la password
            </Link>
          </div>
          
          <div>
            <Link 
              href="/" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 