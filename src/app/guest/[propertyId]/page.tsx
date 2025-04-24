'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import LanguageSelector from '@/components/LanguageSelector'
import { useTranslation, useDynamicTranslation } from '@/contexts/TranslationContext'

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
  const { t } = useTranslation()
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
      name: t('guest_categories.wifi'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      path: `/guest/${propertyId}/wifi-connection`,
    },
    {
      id: 'checkin',
      name: t('guest_categories.checkin'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkin-information`,
    },
    {
      id: 'checkout',
      name: t('guest_categories.checkout'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      path: `/guest/${propertyId}/checkout-information`,
    },
    {
      id: 'house-rules',
      name: t('guest_categories.house_rules'),
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
      name: t('features.how_things_work'),
      icon: '⚙️',
      path: `/guest/${propertyId}/how-things-work`,
      color: 'bg-purple-100',
      available: true
    },
    {
      id: 'before-leaving',
      name: t('features.before_leaving'),
      icon: '🏠',
      path: `/guest/${propertyId}/before-leaving`,
      color: 'bg-pink-100',
      available: true
    },
    {
      id: 'host-guides',
      name: t('features.host_guides'),
      icon: '📚',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-yellow-100',
      available: false
    },
    {
      id: 'book-again',
      name: t('features.book_again'),
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

  // Aggiorna le categorie quando cambia la lingua
  useEffect(() => {
    setCategories([
      {
        id: 'how-things-work',
        name: t('features.how_things_work'),
        icon: '⚙️',
        path: `/guest/${propertyId}/how-things-work`,
        color: 'bg-purple-100',
        available: true
      },
      {
        id: 'before-leaving',
        name: t('features.before_leaving'),
        icon: '🏠',
        path: `/guest/${propertyId}/before-leaving`,
        color: 'bg-pink-100',
        available: true
      },
      {
        id: 'host-guides',
        name: t('features.host_guides'),
        icon: '📚',
        path: `/guest/${propertyId}/city-guide`,
        color: 'bg-yellow-100',
        available: false
      },
      {
        id: 'book-again',
        name: t('features.book_again'),
        icon: '📅',
        path: `/guest/${propertyId}/book-again`,
        color: 'bg-green-100',
        available: true
      }
    ])
  }, [t, propertyId])

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
            
            // Continua con il resto del codice...
            
            // Il resto del codice originale...
            
            setLoading(false);
            return;
          }
          
          // Se ancora non abbiamo trovato la proprietà
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
        const updatedCategories = [...categories]

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
      } catch (error) {
        console.error('Errore nel caricamento della proprietà:', error)
        setError('Impossibile caricare i dettagli della proprietà. Riprova o contatta il servizio clienti.')
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
    </div>
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="text-red-500 text-lg">{error}</div>
    </div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header con nome della proprietà e selettore di lingua */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{propertyName}</h1>
        <LanguageSelector />
      </div>

      {/* Sezione Meteo */}
      {weatherData && (
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl p-4 text-white mb-6">
          <h2 className="text-lg font-medium mb-2">{t('weather.title')} - {weatherData.city}</h2>
          <div className="flex items-center">
            <div className="text-4xl mr-4">{weatherData.icon}</div>
            <div>
              <div className="text-2xl font-semibold">{weatherData.temperature}°C</div>
              <div>{weatherData.condition}</div>
              <div className="text-sm opacity-80">{weatherData.date}</div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">{t('weather.forecast')}:</h3>
            <div className="flex justify-between">
              {weatherData.forecast.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs">{day.day}</div>
                  <div className="text-xl">{day.icon}</div>
                  <div className="text-sm">{day.temperature}°</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categorie Essenziali */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {essentials.map((item) => (
          <Link key={item.id} href={item.path}>
            <div className="bg-white shadow-md rounded-xl p-4 flex items-center space-x-3 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{item.name}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Categorie Principali */}
      <div className="grid grid-cols-2 gap-4">
        {categories.filter(cat => cat.available).map((category) => (
          <Link key={category.id} href={category.path}>
            <div className={`${category.color} rounded-xl p-5 hover:shadow-md transition-shadow`}>
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="font-medium text-gray-800">{category.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 