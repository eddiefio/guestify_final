'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Property {
  id: string
  name: string
  address: string
  city: string
  country: string
}

export default function DashboardClient() {
  const { user, isLoading } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Carica le proprietà dell'utente
  useEffect(() => {
    if (!user) return

    const fetchProperties = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProperties(data || [])
      } catch (error) {
        console.error('Error fetching properties:', error)
        toast.error('Errore nel caricamento delle proprietà')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [user])

  return (
    <ProtectedRoute>
      <Layout title="Dashboard - Guestify">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Le tue proprietà</h1>
            <Link href="/dashboard/add-property">
              <span className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium cursor-pointer shadow-sm">
                Aggiungi proprietà
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Nessuna proprietà</h2>
              <p className="text-gray-600 mb-6">
                Non hai ancora aggiunto nessuna proprietà. Inizia aggiungendo la tua prima proprietà.
              </p>
              <Link href="/dashboard/add-property">
                <span className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium cursor-pointer shadow-sm inline-block">
                  Aggiungi la tua prima proprietà
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{property.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {property.address}, {property.city}, {property.country}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Link href={`/dashboard/property/${property.id}/qr-code`}>
                        <span className="bg-[#ffde59] text-black px-3 py-2 rounded text-center font-medium hover:bg-opacity-90 transition-colors cursor-pointer block">
                          QR Code
                        </span>
                      </Link>
                      <Link href={`/dashboard/property/${property.id}/extra-services`}>
                        <span className="bg-[#ffde59] text-black px-3 py-2 rounded text-center font-medium hover:bg-opacity-90 transition-colors cursor-pointer block">
                          Servizi Extra
                        </span>
                      </Link>
                      <Link href={`/dashboard/property/${property.id}/house-rules`}>
                        <span className="bg-[#ffde59] text-black px-3 py-2 rounded text-center font-medium hover:bg-opacity-90 transition-colors cursor-pointer block">
                          Regole Casa
                        </span>
                      </Link>
                      <Link href={`/dashboard/property/${property.id}/wifi`}>
                        <span className="bg-[#ffde59] text-black px-3 py-2 rounded text-center font-medium hover:bg-opacity-90 transition-colors cursor-pointer block">
                          WiFi
                        </span>
                      </Link>
                      <Link href={`/dashboard/property/${property.id}/city-guide`}>
                        <span className="bg-[#ffde59] text-black px-3 py-2 rounded text-center font-medium hover:bg-opacity-90 transition-colors cursor-pointer block">
                          Guida Città
                        </span>
                      </Link>
                    </div>
                    <div className="flex justify-between mt-4">
                      <Link href={`/dashboard/edit-property/${property.id}`}>
                        <span className="text-[#5E2BFF] hover:underline font-medium cursor-pointer">
                          Modifica
                        </span>
                      </Link>
                      <Link href={`/dashboard/delete-property/${property.id}`}>
                        <span className="text-red-600 hover:underline font-medium cursor-pointer">
                          Elimina
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}