'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  icon: string
  path: string
  color: string
  available: boolean
}

export default function GuestHomePage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lista delle categorie essenziali
  const essentials = [
    {
      id: 'wifi',
      name: 'Wifi',
      icon: '📶',
      path: `/guest/${propertyId}/wifi-connection`,
    },
    {
      id: 'checkin',
      name: 'Checkin',
      icon: '🔑',
      path: `/guest/${propertyId}/house-info`,
    },
    {
      id: 'checkout',
      name: 'Checkout',
      icon: '📤',
      path: `/guest/${propertyId}/house-info`,
    },
    {
      id: 'house-rules',
      name: 'House Rules',
      icon: '📋',
      path: `/guest/${propertyId}/house-rules`,
    },
  ]

  // Lista delle categorie principali
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'house-info',
      name: 'House Info',
      icon: '🏠',
      path: `/guest/${propertyId}/house-info`,
      color: 'bg-blue-100',
      available: false
    },
    {
      id: 'extra-services',
      name: 'Extra Services',
      icon: '🛎️',
      path: `/guest/${propertyId}/extra-services`,
      color: 'bg-green-100',
      available: false
    },
    {
      id: 'host-guides',
      name: 'Host Guides',
      icon: '📚',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-yellow-100',
      available: false
    }
  ])

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError
        setPropertyName(property.name)

        // Verificare quali sezioni sono disponibili per questa proprietà
        const updatedCategories = [...categories]

        // Verifica house_info
        const { count: houseInfoCount } = await supabase
          .from('house_info')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (houseInfoCount && houseInfoCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'house-info')
          if (index >= 0) updatedCategories[index].available = true
        }

        // Verifica extra_services
        const { count: extraServicesCount } = await supabase
          .from('extra_services')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (extraServicesCount && extraServicesCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'extra-services')
          if (index >= 0) updatedCategories[index].available = true
        }

        // Verifica city_guides
        const { count: cityGuideCount } = await supabase
          .from('city_guides')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (cityGuideCount && cityGuideCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
          if (index >= 0) updatedCategories[index].available = true
        }

        setCategories(updatedCategories)
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
          <h1 className="text-xl font-bold text-[#5E2BFF]">Guestify</h1>
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
          <div className="space-y-8">
            {/* Sezione Essentials */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Essentials</h2>
              <div className="grid grid-cols-4 gap-4">
                {essentials.map((item) => (
                  <Link href={item.path} key={item.id} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-md text-2xl">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-700 block">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sezione Servizi Extra */}
            <div>
              <Link href={`/guest/${propertyId}/extra-services`}>
                <div className="bg-green-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🛎️</div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Extra Services</h2>
                      <p className="text-sm text-gray-600">Scopri i servizi aggiuntivi disponibili</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* House Info e Host Guides */}
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/guest/${propertyId}/house-info`}>
                <div className="bg-blue-100 rounded-xl p-4 shadow-sm h-full">
                  <div className="text-2xl mb-2">🏠</div>
                  <h2 className="text-base font-semibold text-gray-800">House Info</h2>
                  <p className="text-xs text-gray-600">Informazioni sulla casa</p>
                </div>
              </Link>
              <Link href={`/guest/${propertyId}/city-guide`}>
                <div className="bg-yellow-100 rounded-xl p-4 shadow-sm h-full">
                  <div className="text-2xl mb-2">📚</div>
                  <h2 className="text-base font-semibold text-gray-800">Host Guides</h2>
                  <p className="text-xs text-gray-600">Guide e suggerimenti</p>
                </div>
              </Link>
            </div>

            {/* Hot Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Hot Information</h2>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-base font-medium">Quali cibi sono sconsigliati per il gatto</h3>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-base font-medium">Perché le zanzare amano il sangue</h3>
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