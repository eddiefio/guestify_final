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

  // List of essential categories with SVG icons
  const essentials = [
    {
      id: 'wifi',
      name: 'Wifi',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      path: `/guest/${propertyId}/wifi-connection`,
    },
    {
      id: 'checkin',
      name: 'Checkin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkin-information`,
    },
    {
      id: 'checkout',
      name: 'Checkout',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkout-information`,
    },
    {
      id: 'house-rules',
      name: 'House Rules',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: `/guest/${propertyId}/house-rules`,
    },
  ]

  // List of main categories
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'how-things-work',
      name: 'How Things Work',
      icon: '⚙️',
      path: `/guest/${propertyId}/how-things-work`,
      color: 'bg-purple-100',
      available: true
    },
    {
      id: 'before-leaving',
      name: 'Before You Leave Home',
      icon: '🏠',
      path: `/guest/${propertyId}/before-leaving`,
      color: 'bg-pink-100',
      available: true
    },
    {
      id: 'host-guides',
      name: 'Host Guides',
      icon: '📚',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-yellow-100',
      available: false
    },
    {
      id: 'book-again',
      name: 'Book Again',
      icon: '📅',
      path: `/guest/${propertyId}/book-again`,
      color: 'bg-green-100',
      available: true
    }
  ])

  // Function to get simulated weather data
  const fetchWeatherData = async (city: string) => {
    // In a real app, you would call a weather API
    // For now we create simulated data
    const mockWeatherData: WeatherData = {
      temperature: 23,
      condition: 'Sunny',
      icon: '☀️',
      city: city,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
      forecast: [
        { day: 'Tue', temperature: 25, icon: '☀️' },
        { day: 'Wed', temperature: 22, icon: '⛅' },
        { day: 'Thu', temperature: 20, icon: '🌧️' },
        { day: 'Fri', temperature: 18, icon: '🌧️' },
        { day: 'Sat', temperature: 21, icon: '⛅' },
      ]
    }
    
    return mockWeatherData
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    console.log('Searching:', searchQuery)
  }

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('name, city')
          .eq('id', propertyId)
        
        if (propError) {
          console.error('Error fetching property:', propError)
          throw propError
        }

        if (!properties || properties.length === 0) {
          throw new Error('Property not found. Please check the QR code.')
        }

        const property = properties[0]
        setPropertyName(property.name)
        
        if (property.city) {
          setPropertyCity(property.city)
          
          // Get weather data for the property's city
          const weather = await fetchWeatherData(property.city)
          setWeatherData(weather)
        }

        // Check which sections are available for this property
        const updatedCategories = [...categories]

        // Check city_guides
        const { count: cityGuideCount } = await supabase
          .from('city_guides')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId)
        
        if (cityGuideCount && cityGuideCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
          if (index >= 0) updatedCategories[index].available = true
        }
        
        setCategories(updatedCategories)

      } catch (error) {
        console.error('Error loading property data:', error)
        setError('Failed to load property data. Please try again or contact support.')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-spartan">
        <div className="w-16 h-16 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-600">Loading property information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-spartan p-6 text-center">
        <div className="p-3 rounded-full bg-red-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Error Loading Property</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg hover:bg-[#4a22cc] transition duration-200 font-bold shadow-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-[#5E2BFF]">Welcome to {propertyName}</h1>
          {propertyCity && (
            <p className="text-gray-600 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {propertyCity}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Weather Section */}
        {weatherData && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-6 text-white shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">{weatherData.date}</p>
                <div className="flex items-center mt-1">
                  <span className="text-3xl mr-1">{weatherData.icon}</span>
                  <span className="text-2xl font-bold">{weatherData.temperature}°C</span>
                </div>
                <p className="text-sm mt-1">{weatherData.condition} in {weatherData.city}</p>
              </div>
              <div className="flex space-x-3">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="text-center">
                    <p className="text-xs">{day.day}</p>
                    <p className="text-xl my-1">{day.icon}</p>
                    <p className="text-xs">{day.temperature}°</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </form>

        {/* Essential Quick Links */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Essential Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {essentials.map((item) => (
              <Link 
                href={item.path} 
                key={item.id}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-[#5E2BFF]/10 flex items-center justify-center mb-2">
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-gray-700">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Categories */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Property Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <Link 
                href={category.available ? category.path : '#'} 
                key={category.id}
                className={`flex items-center p-5 rounded-xl ${category.color} ${category.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'} transition duration-200`}
              >
                <div className="text-3xl mr-3">{category.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{category.name}</h3>
                  {!category.available && <p className="text-xs text-gray-600">Not available</p>}
                </div>
                {category.available && (
                  <svg className="w-5 h-5 ml-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Extra Services Banner */}
        <div className="mt-8">
          <Link href={`/guest/${propertyId}/extra-services`}>
            <div className="bg-gradient-to-r from-[#5E2BFF] to-[#7e58ff] rounded-xl p-5 text-white shadow-md hover:shadow-lg transition duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Extra Services</h3>
                  <p className="text-sm text-white/80">Discover additional services for your stay</p>
                </div>
                <svg className="w-6 h-6 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t shadow-lg fixed bottom-0 left-0 right-0 w-full">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center text-[#5E2BFF]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs mt-1">Map</span>
          </Link>
          
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs mt-1">Contacts</span>
          </Link>
          
          <Link href={`/guest/${propertyId}/extra-services`} className="flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">Services</span>
          </Link>
        </div>
      </nav>
    </div>
  )
} 