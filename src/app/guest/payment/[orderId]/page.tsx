// Server Component (la pagina principale)
import { Suspense } from 'react'
import PaymentClient from './PaymentClient'
import { ChevronLeft } from 'lucide-react'

// Definiamo il parametro di tipo corretto per la pagina
interface PageProps {
  params: {
    orderId: string
  }
}

// Server component che renderizza il layout e passa i parametri al client component
export default function PaymentPage({ params }: PageProps) {
  const { orderId } = params;
  
  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => {}} // Questa è una no-op nel server component
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Pagamento</h1>
          </div>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffde59] mx-auto"></div>
          <p className="text-center mt-4">Caricamento pagamento...</p>
        </div>
      }>
        <PaymentClient orderId={orderId} />
      </Suspense>
    </div>
  )
} 