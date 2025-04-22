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

interface WeatherData {
  temperature: number
  condition: string
  icon: string
  city: string
  date: string
  forecast: Array<{
    day: string
    temperature: number
    icon: string
  }>
}

export default function GuestHomePage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [propertyCity, setPropertyCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)

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

  // Funzione per ottenere dati meteo simulati
  const fetchWeatherData = async (city: string) => {
    // In un'app reale, qui chiameresti un'API meteo
    // Per ora creiamo dati simulati
    const mockWeatherData: WeatherData = {
      temperature: 23,
      condition: 'Soleggiato',
      icon: '☀️',
      city: city,
      date: new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }),
      forecast: [
        { day: 'Mar', temperature: 25, icon: '☀️' },
        { day: 'Mer', temperature: 22, icon: '⛅' },
        { day: 'Gio', temperature: 20, icon: '🌧️' },
        { day: 'Ven', temperature: 18, icon: '🌧️' },
        { day: 'Sab', temperature: 21, icon: '⛅' },
      ]
    }
    
    return mockWeatherData
  }

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name, city')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError
        setPropertyName(property.name)
        
        if (property.city) {
          setPropertyCity(property.city)
          
          // Ottieni dati meteo per la città della proprietà
          const weather = await fetchWeatherData(property.city)
          setWeatherData(weather)
        }

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
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="relative h-12 w-12">
            <Image 
              src="/images/logo_guest.png"
              alt="Guestify Logo"
              fill
              className="object-contain"
            />
          </div>
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
              <h2 className="text-lg font-bold text-[#5E2BFF] mb-4">Essentials</h2>
              <div className="grid grid-cols-4 gap-4">
                {essentials.map((item) => (
                  <Link href={item.path} key={item.id} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-md text-2xl border-2 border-[#5E2BFF]">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-700 block font-bold">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sezione Servizi Extra */}
            <div>
              <Link href={`/guest/${propertyId}/extra-services`}>
                <div className="bg-[#5E2BFF] text-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🛎️</div>
                    <div>
                      <h2 className="text-lg font-bold">Extra Services</h2>
                      <p className="text-sm text-white opacity-80">Scopri i servizi aggiuntivi disponibili</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                <div className="bg-blue-100 rounded-xl p-4 shadow-sm h-full border-2 border-blue-200">
                  <div className="text-2xl mb-2">🏠</div>
                  <h2 className="text-base font-bold text-gray-800">House Info</h2>
                  <p className="text-xs text-gray-600">Informazioni sulla casa</p>
                </div>
              </Link>
              <Link href={`/guest/${propertyId}/city-guide`}>
                <div className="bg-[#ffde59] rounded-xl p-4 shadow-sm h-full border-2 border-yellow-300">
                  <div className="text-2xl mb-2">📚</div>
                  <h2 className="text-base font-bold text-gray-800">Host Guides</h2>
                  <p className="text-xs text-gray-600">Guide e suggerimenti</p>
                </div>
              </Link>
            </div>

            {/* Weather Information */}
            {weatherData && (
              <div>
                <h2 className="text-lg font-bold text-[#5E2BFF] mb-4">Meteo a {weatherData.city}</h2>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden text-white shadow-lg">
                  <div className="p-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">{weatherData.date}</h3>
                        <p className="text-sm opacity-90">{weatherData.city}</p>
                      </div>
                      <div className="text-4xl">{weatherData.icon}</div>
                    </div>
                    <div className="mt-6 flex items-end">
                      <span className="text-5xl font-bold">{weatherData.temperature}°C</span>
                      <span className="ml-2 text-lg opacity-90">{weatherData.condition}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 p-4">
                    <div className="flex justify-between">
                      {weatherData.forecast.map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-sm font-bold">{day.day}</div>
                          <div className="text-xl my-1">{day.icon}</div>
                          <div className="text-sm">{day.temperature}°</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Barra di navigazione */}
      <nav className="bg-white border-t shadow-lg mt-auto">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  )
} 