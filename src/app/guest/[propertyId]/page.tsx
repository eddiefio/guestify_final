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
  const [searchQuery, setSearchQuery] = useState('')

  // Lista delle categorie essenziali con icone SVG
  const essentials = [
    {
      id: 'wifi',
      name: 'Wifi',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      path: `/guest/${propertyId}/wifi-connection`,
    },
    {
      id: 'checkin',
      name: 'Checkin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      path: `/guest/${propertyId}/house-info`,
    },
    {
      id: 'checkout',
      name: 'Checkout',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      path: `/guest/${propertyId}/house-info`,
    },
    {
      id: 'house-rules',
      name: 'House Rules',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementare la funzionalità di ricerca qui
    console.log('Cercando:', searchQuery)
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
          <div className="relative h-20 w-20">
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

      <main className="flex-grow max-w-7xl mx-auto px-4 py-4 sm:px-6">
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
          <div className="space-y-4">
            {/* Barra di ricerca */}
            <div className="relative">
              <form onSubmit={handleSearch} className="w-full">
                <input
                  type="text"
                  placeholder="Cerca informazioni..."
                  className="w-full p-3 pl-10 pr-4 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Sezione Essentials */}
            <div>
              <h2 className="text-lg font-bold text-[#5E2BFF] mb-2">Essentials</h2>
              <div className="grid grid-cols-4 gap-3">
                {essentials.map((item) => (
                  <Link href={item.path} key={item.id} className="text-center">
                    <div className="w-14 h-14 mx-auto mb-1 bg-white rounded-full flex items-center justify-center shadow-md">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-700 block font-bold">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sezione Servizi Extra */}
            <div>
              <Link href={`/guest/${propertyId}/extra-services`}>
                <div className="bg-[#5E2BFF] text-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Extra Services</h2>
                      <p className="text-xs text-white opacity-80">Scopri i servizi aggiuntivi disponibili</p>
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
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/guest/${propertyId}/house-info`}>
                <div className="bg-blue-100 rounded-xl p-3 shadow-sm h-full border-2 border-blue-200">
                  <div className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">House Info</h2>
                  <p className="text-xs text-gray-600">Informazioni sulla casa</p>
                </div>
              </Link>
              <Link href={`/guest/${propertyId}/city-guide`}>
                <div className="bg-[#ffde59] rounded-xl p-3 shadow-sm h-full border-2 border-yellow-300">
                  <div className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">Host Guides</h2>
                  <p className="text-xs text-gray-600">Guide e suggerimenti</p>
                </div>
              </Link>
            </div>

            {/* Weather Information */}
            {weatherData && (
              <div>
                <h2 className="text-lg font-bold text-[#5E2BFF] mb-2">Meteo a {weatherData.city}</h2>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden text-white shadow-lg">
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold">{weatherData.date}</h3>
                        <p className="text-xs opacity-90">{weatherData.city}</p>
                      </div>
                      <div className="text-3xl">{weatherData.icon}</div>
                    </div>
                    <div className="mt-2 flex items-end">
                      <span className="text-3xl font-bold">{weatherData.temperature}°C</span>
                      <span className="ml-2 text-sm opacity-90">{weatherData.condition}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 p-2">
                    <div className="flex justify-between">
                      {weatherData.forecast.map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs font-bold">{day.day}</div>
                          <div className="text-lg my-1">{day.icon}</div>
                          <div className="text-xs">{day.temperature}°</div>
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
        <div className="flex justify-around items-center h-14">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
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