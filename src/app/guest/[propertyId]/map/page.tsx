'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MapPage() {
  const params = useParams()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name, address')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError
        setPropertyName(property.name)
        setAddress(property.address || null)
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching property data:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#5E2BFF]">Mappa</h1>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Caricamento informazioni...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Posizione della proprietà</h2>
                {address && <p className="text-gray-600 mt-1">{address}</p>}
              </div>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-72 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-gray-500">Mappa non disponibile al momento</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Luoghi di interesse nelle vicinanze</h3>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🍽️</div>
                  <div>
                    <h4 className="font-medium">Ristoranti</h4>
                    <p className="text-sm text-gray-600">Scopri i ristoranti vicini</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🛒</div>
                  <div>
                    <h4 className="font-medium">Supermercati</h4>
                    <p className="text-sm text-gray-600">Trova i supermercati nella zona</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🚌</div>
                  <div>
                    <h4 className="font-medium">Trasporti</h4>
                    <p className="text-sm text-gray-600">Fermate degli autobus e stazioni vicine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra di navigazione */}
      <nav className="bg-white border-t shadow-lg mt-auto">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">📞</div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">🏠</div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">🗺️</div>
          </Link>
        </div>
      </nav>
    </div>
  )
} 