'use client'

import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutCancel() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <XCircle className="text-red-500 w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Pagamento Annullato
          </h1>
          <p className="text-gray-600 mt-2 text-center">
            Il processo di pagamento è stato annullato. Nessun addebito è stato effettuato.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 pb-4">
          <p className="text-gray-600 text-center mb-6">
            Se hai riscontrato problemi durante il pagamento o hai domande sul tuo ordine, 
            non esitare a contattare il nostro team di assistenza.
          </p>
          
          <div className="flex flex-col space-y-3">
            <Button className="w-full" asChild>
              <Link href="/guest/dashboard">Torna alla Dashboard</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/support">Contatta Assistenza</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 