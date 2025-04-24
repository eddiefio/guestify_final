'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
// Import i18n e LanguageSelector
import '../../../../src/lib/i18n'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '@/components/LanguageSelector'

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
  
  // Aggiungi hook useTranslation
  const { t, i18n } = useTranslation('common')

  // List of essential categories with SVG icons
  const essentials = [
    {
      id: 'wifi',
      name: t('guest.essentials.wifi'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      path: `/guest/${propertyId}/wifi-connection`,
    },
    {
      id: 'checkin',
      name: t('guest.essentials.checkin'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkin-information`,
    },
    {
      id: 'checkout',
      name: t('guest.essentials.checkout'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkout-information`,
    },
    {
      id: 'house-rules',
      name: t('guest.essentials.houseRules'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: `/guest/${propertyId}/house-rules`,
    },
  ]

  // Aggiorno le categorie per usare le traduzioni
  const getTranslatedCategories = () => [
    {
      id: 'how-things-work',
      name: t('guest.categories.howThingsWork'),
      icon: '⚙️',
      path: `/guest/${propertyId}/how-things-work`,
      color: 'bg-purple-100',
      available: true
    },
    {
      id: 'before-leaving',
      name: t('guest.categories.beforeLeaving'),
      icon: '🏠',
      path: `/guest/${propertyId}/before-leaving`,
      color: 'bg-pink-100',
      available: true
    },
    {
      id: 'host-guides',
      name: t('guest.categories.hostGuides'),
      icon: '📚',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-yellow-100',
      available: false
    },
    {
      id: 'book-again',
      name: t('guest.categories.bookAgain'),
      icon: '📅',
      path: `/guest/${propertyId}/book-again`,
      color: 'bg-green-100',
      available: true
    }
  ]

  // Aggiorno le categorie quando cambia la lingua
  useEffect(() => {
    setCategories(getTranslatedCategories())
  }, [i18n.language])

  const [categories, setCategories] = useState<Category[]>(getTranslatedCategories())

  // Function to get simulated weather data
  const fetchWeatherData = async (city: string) => {
    // In a real app, you would call a weather API
    // For now we create simulated data
    const mockWeatherData: WeatherData = {
      temperature: 23,
      condition: 'Sunny',
      icon: '☀️',
      city: city,
      date: new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }),
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
        
        // Debug: mostra l'ID della proprietà
        console.log('Tentativo di caricare proprietà con ID:', propertyId);
        console.log('Tipo di propertyId:', typeof propertyId);
        
        if (!propertyId) {
          throw new Error('ID della proprietà mancante');
        }
        
        // Normalizza l'ID (rimuovi spazi, converti in minuscolo)
        const normalizedId = propertyId.toString().trim();
        console.log('ID normalizzato:', normalizedId);

        // Fetch property details - modifica per evitare errori con .single()
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('name, city')
          .eq('id', normalizedId)
        
        // Debug: log della risposta
        console.log('Risposta Supabase:', { data: properties, error: propError });
        
        if (propError) {
          console.error('Errore Supabase:', propError);
          throw propError;
        }

        // Se non ci sono proprietà, prova a cercare con ID diversi (maiuscole/minuscole)
        if (!properties || properties.length === 0) {
          console.log('Proprietà non trovata, tentativo con ricerca più ampia...');
          
          // Prova una query ilike (case insensitive)
          const { data: propertiesAlt, error: errorAlt } = await supabase
            .from('properties')
            .select('name, city')
            .ilike('id', `%${normalizedId}%`)
            .limit(1);
          
          console.log('Risultato ricerca alternativa:', { data: propertiesAlt, error: errorAlt });
          
          if (propertiesAlt && propertiesAlt.length > 0) {
            const property = propertiesAlt[0];
            setPropertyName(property.name);
            
            if (property.city) {
              setPropertyCity(property.city);
              const weather = await fetchWeatherData(property.city);
              setWeatherData(weather);
            }
            
            const updatedCategories = [...getTranslatedCategories()];
            
            // Check city_guides
            const { count: cityGuideCount } = await supabase
              .from('city_guides')
              .select('id', { count: 'exact', head: true })
              .eq('property_id', normalizedId)
            
            if (cityGuideCount && cityGuideCount > 0) {
              const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
              if (index >= 0) updatedCategories[index].available = true
            }
            
            setCategories(updatedCategories);
            setLoading(false);
            return;
          }
          
          throw new Error('Proprietà non trovata. Verifica l\'ID o scansiona nuovamente il QR code.');
        }

        // Se ci sono più proprietà, usa la prima
        const property = properties[0];
        setPropertyName(property.name);
        
        if (property.city) {
          setPropertyCity(property.city);
          
          // Get weather data for the property's city
          const weather = await fetchWeatherData(property.city);
          setWeatherData(weather);
        }

        // Check which sections are available for this property
        const updatedCategories = [...getTranslatedCategories()]

        // Check city_guides
        const { count: cityGuideCount } = await supabase
          .from('city_guides')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', normalizedId)
        
        if (cityGuideCount && cityGuideCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
          if (index >= 0) updatedCategories[index].available = true
        }

        setCategories(updatedCategories)
        setLoading(false)
      } catch (err: any) {
        console.error('Error loading property:', err);
        setError(err.message || 'Error loading property');
        setLoading(false);
      }
    }

    fetchPropertyData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con il selettore di lingua */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#5E2BFF]">
          {propertyName || 'Property'}
        </h1>
        <LanguageSelector />
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Essentials */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Essentials</h2>
          <div className="grid grid-cols-4 gap-4">
            {essentials.map((item) => (
              <Link
                href={item.path}
                key={item.id}
                className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-2">{item.icon}</div>
                <span className="text-center text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder={t('guest.search.placeholder')}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-[#5E2BFF] text-white px-4 py-1 rounded-md"
            >
              {t('guest.search.button')}
            </button>
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </form>
        </div>

        {/* Weather */}
        {weatherData && (
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-2">{t('guest.weather.forecast')}</h2>
            <div className="flex items-center">
              <div className="text-4xl mr-4">{weatherData.icon}</div>
              <div>
                <p className="text-xl font-medium">{weatherData.temperature}°C</p>
                <p>{weatherData.condition}</p>
                <p className="text-sm text-gray-500">{weatherData.city}</p>
                <p className="text-sm text-gray-500">{weatherData.date}</p>
              </div>
            </div>

            {/* Forecast */}
            <div className="mt-4 flex justify-between">
              {weatherData.forecast.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm font-medium">{day.day}</p>
                  <p className="text-xl my-1">{day.icon}</p>
                  <p className="text-sm">{day.temperature}°C</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          {categories
            .filter((category) => category.available)
            .map((category) => (
              <Link
                href={category.path}
                key={category.id}
                className={`${category.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center`}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <h3 className="font-medium text-gray-800">{category.name}</h3>
              </Link>
            ))}
        </div>
      </main>
    </div>
  )
} 