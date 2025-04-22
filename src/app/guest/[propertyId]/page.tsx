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

  // Lista delle categorie predefinite
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'house-info',
      name: 'Informazioni sulla Casa',
      icon: '/icons/house-info.svg',
      path: `/guest/${propertyId}/house-info`,
      color: 'bg-blue-50 hover:bg-blue-100',
      available: false
    },
    {
      id: 'extra-services',
      name: 'Servizi Extra',
      icon: '/icons/extra-services.svg',
      path: `/guest/${propertyId}/extra-services`,
      color: 'bg-green-50 hover:bg-green-100',
      available: false
    },
    {
      id: 'house-rules',
      name: 'Regole della Casa',
      icon: '/icons/house-rules.svg',
      path: `/guest/${propertyId}/house-rules`,
      color: 'bg-red-50 hover:bg-red-100',
      available: false
    },
    {
      id: 'wifi-connection',
      name: 'Connessione WiFi',
      icon: '/icons/wifi.svg',
      path: `/guest/${propertyId}/wifi-connection`,
      color: 'bg-purple-50 hover:bg-purple-100',
      available: false
    },
    {
      id: 'city-guide',
      name: 'Guida della Città',
      icon: '/icons/city-guide.svg',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-yellow-50 hover:bg-yellow-100',
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

        // Verifica house_rules
        const { count: houseRulesCount } = await supabase
          .from('house_rules')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (houseRulesCount && houseRulesCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'house-rules')
          if (index >= 0) updatedCategories[index].available = true
        }

        // Verifica wifi_credentials
        const { count: wifiCount } = await supabase
          .from('wifi_credentials')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (wifiCount && wifiCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'wifi-connection')
          if (index >= 0) updatedCategories[index].available = true
        }

        // Verifica city_guides
        const { count: cityGuideCount } = await supabase
          .from('city_guides')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (cityGuideCount && cityGuideCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'city-guide')
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

  // Filtra solo le categorie disponibili
  const availableCategories = categories.filter(cat => cat.available)

  // Se house-info è disponibile, reindirizza direttamente a quella pagina
  useEffect(() => {
    const houseInfoCategory = categories.find(cat => cat.id === 'house-info')
    if (!loading && houseInfoCategory?.available && router) {
      router.push(houseInfoCategory.path)
    }
  }, [categories, loading, router])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#5E2BFF]">Guestify</h1>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Caricamento informazioni...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : availableCategories.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Nessuna informazione disponibile</h2>
            <p className="text-gray-600">L'host non ha ancora aggiunto informazioni per questa proprietà.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableCategories.map((category) => (
              <Link href={category.path} key={category.id}>
                <div className={`p-6 rounded-xl shadow-sm ${category.color} transition duration-200 cursor-pointer`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      {/* Placeholder per icona */}
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#5E2BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{category.name}</h2>
                      <p className="text-sm text-gray-600">Scopri di più</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          <p>Powered by Guestify</p>
        </div>
      </footer>
    </div>
  )
} 