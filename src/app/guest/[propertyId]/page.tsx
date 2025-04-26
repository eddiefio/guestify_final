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
  const [searchResults, setSearchResults] = useState<Array<{title: string, description: string, path: string}>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState<{
    houseRules: Array<{title: string}>;
    extraServices: Array<{title: string, description: string}>;
    cityGuideTitle?: string;
    howThingsWork: Array<{title: string, description: string}>;
    beforeLeaving: Array<{title: string, description: string}>;
  }>({
    houseRules: [],
    extraServices: [],
    howThingsWork: [],
    beforeLeaving: [],
  })

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

  // Function to get weather data from OpenWeatherMap API
  const fetchWeatherData = async (city: string) => {
    try {
      const apiKey = 'ecf9903b2edd9ef9d93ac875709b5357'; // API key gratuita per OpenWeatherMap
      
      // Chiamata per ottenere il meteo corrente
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      );
      
      if (!currentResponse.ok) {
        throw new Error('Errore nella richiesta meteo corrente');
      }
      
      const currentData = await currentResponse.json();
      
      // Chiamata per ottenere la previsione per 5 giorni
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`
      );
      
      if (!forecastResponse.ok) {
        throw new Error('Errore nella richiesta previsioni meteo');
      }
      
      const forecastData = await forecastResponse.json();
      
      // Ottieni il giorno attuale e altri giorni della settimana in italiano
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      
      // Inizializza le previsioni con il giorno corrente
      const dailyForecasts = [{
        day: days[today.getDay()],
        temperature: Math.round(currentData.main.temp),
        icon: getWeatherIcon(currentData.weather[0].id),
      }];
      
      const processedDates = new Set();
      // Aggiungi la data di oggi al set per evitare duplicati
      processedDates.add(today.toISOString().split('T')[0]);
      
      // Estrai previsioni per i prossimi 4 giorni (prendendo la previsione alle 12:00)
      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        // Prendi solo una previsione per giorno e non quella di oggi (già aggiunta)
        if (!processedDates.has(dateStr)) {
          processedDates.add(dateStr);
          
          const dayIndex = date.getDay();
          
          dailyForecasts.push({
            day: days[dayIndex],
            temperature: Math.round(item.main.temp),
            icon: getWeatherIcon(item.weather[0].id),
          });
          
          // Ferma dopo 5 giorni in totale (oggi + 4 giorni successivi)
          if (dailyForecasts.length >= 5) break;
        }
      }
      
      // Formatta la data corrente
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      };
      const currentDate = today.toLocaleDateString('en-US', options);
      
      // Costruisci l'oggetto WeatherData
      const weatherData: WeatherData = {
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].description,
        icon: getWeatherIcon(currentData.weather[0].id),
        city: currentData.name,
        date: currentDate,
        forecast: dailyForecasts
      };
      
      return weatherData;
    } catch (error) {
      console.error('Errore nel recupero dei dati meteo:', error);
      // In caso di errore, ritorna dati simulati
      const today = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayIndex = today.getDay();
      
      const mockWeatherData: WeatherData = {
        temperature: 23,
        condition: 'Sunny',
        icon: '☀️',
        city: city,
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
        forecast: [
          { day: days[todayIndex], temperature: 23, icon: '☀️' },
          { day: days[(todayIndex + 1) % 7], temperature: 25, icon: '☀️' },
          { day: days[(todayIndex + 2) % 7], temperature: 22, icon: '⛅' },
          { day: days[(todayIndex + 3) % 7], temperature: 20, icon: '🌧️' },
          { day: days[(todayIndex + 4) % 7], temperature: 18, icon: '🌧️' },
        ]
      };
      
      return mockWeatherData;
    }
  }

  // Helper function to get weather icon based on OpenWeatherMap condition code
  const getWeatherIcon = (code: number): string => {
    // Converti i codici condizioni meteo in emoji
    if (code >= 200 && code < 300) return '⚡'; // Temporale
    if (code >= 300 && code < 400) return '🌧️'; // Pioviggine
    if (code >= 500 && code < 600) return '🌧️'; // Pioggia
    if (code >= 600 && code < 700) return '❄️'; // Neve
    if (code >= 700 && code < 800) return '🌫️'; // Foschia/Nebbia
    if (code === 800) return '☀️'; // Cielo sereno
    if (code === 801) return '🌤️'; // Poche nuvole
    if (code === 802) return '⛅'; // Nubi sparse
    if (code === 803 || code === 804) return '☁️'; // Nuvoloso
    return '☀️'; // Default
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
          .select('name, city, id')
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
            .select('name, city, id')
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
            
            // Fetch additional property content for search
            await fetchPropertyContentForSearch(property.id);
            
            // Continua con il resto del codice...
            const updatedCategories = [...categories];
            
            // Check city_guides
            const { count: cityGuideCount } = await supabase
              .from('city_guides')
              .select('id', { count: 'exact', head: true })
              .eq('property_id', property.id) // Usa l'ID corretto
            
            if (cityGuideCount && cityGuideCount > 0) {
              const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
              if (index >= 0) updatedCategories[index].available = true
            }
            
            setCategories(updatedCategories);
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

        // Fetch additional property content for search
        await fetchPropertyContentForSearch(property.id);

        // Check which sections are available for this property
        const updatedCategories = [...categories]

        // Check city_guides
        const { count: cityGuideCount } = await supabase
          .from('city_guides')
          .select('id, title', { count: 'exact', head: false })
          .eq('property_id', property.id)
        
        if (cityGuideCount && cityGuideCount > 0) {
          const index = updatedCategories.findIndex(cat => cat.id === 'host-guides')
          if (index >= 0) updatedCategories[index].available = true
          
          // Save city guide title for search
          if (Array.isArray(cityGuideCount) && cityGuideCount.length > 0 && cityGuideCount[0].title) {
            setPropertyDetails(prev => ({
              ...prev,
              cityGuideTitle: cityGuideCount[0].title
            }));
          }
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

  // Function to fetch property content for search
  const fetchPropertyContentForSearch = async (propertyId: string) => {
    try {
      // Fetch house rules
      const { data: houseRules, error: rulesError } = await supabase
        .from('house_rules')
        .select('title')
        .eq('property_id', propertyId)
      
      if (!rulesError && houseRules) {
        setPropertyDetails(prev => ({
          ...prev,
          houseRules: houseRules
        }));
      }
      
      // Fetch extra services
      const { data: extraServices, error: servicesError } = await supabase
        .from('extra_services')
        .select('title, description')
        .eq('property_id', propertyId)
      
      if (!servicesError && extraServices) {
        setPropertyDetails(prev => ({
          ...prev,
          extraServices: extraServices
        }));
      }

      // Fetch how things work articles
      const { data: howThingsWork, error: howThingsWorkError } = await supabase
        .from('how_things_work')
        .select('title, description')
        .eq('property_id', propertyId)
      
      if (!howThingsWorkError && howThingsWork) {
        setPropertyDetails(prev => ({
          ...prev,
          howThingsWork: howThingsWork
        }));
      }

      // Fetch before leaving articles
      const { data: beforeLeaving, error: beforeLeavingError } = await supabase
        .from('before_leaving')
        .select('title, description')
        .eq('property_id', propertyId)
      
      if (!beforeLeavingError && beforeLeaving) {
        setPropertyDetails(prev => ({
          ...prev,
          beforeLeaving: beforeLeaving
        }));
      }
    } catch (error) {
      console.error('Error fetching property content for search:', error);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If search query is empty, don't show results
    if (!searchQuery.trim()) {
      setShowSearchResults(false)
      return
    }
    
    // Search pages and data
    const query = searchQuery.toLowerCase()
    const results = []
    
    // Search in essentials
    essentials.forEach(item => {
      if (item.name.toLowerCase().includes(query)) {
        results.push({
          title: item.name,
          description: `Essential service for guests`,
          path: item.path
        })
      }
    })
    
    // Search in main categories
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(query) && category.available) {
        results.push({
          title: category.name,
          description: `Category with useful information`,
          path: category.path
        })
      }
    })
    
    // Add extra services with descriptions
    if ('extra services'.includes(query) || 'additional services'.includes(query)) {
      results.push({
        title: 'Extra Services',
        description: 'Discover available additional services',
        path: `/guest/${propertyId}/extra-services`
      })
    }
    
    // Search in host's extra services
    propertyDetails.extraServices.forEach(service => {
      if (
        service.title.toLowerCase().includes(query) || 
        (service.description && service.description.toLowerCase().includes(query))
      ) {
        results.push({
          title: service.title,
          description: service.description || 'Additional service provided by host',
          path: `/guest/${propertyId}/extra-services`
        })
      }
    })
    
    // Add house rules
    if ('house rules'.includes(query) || 'rules'.includes(query)) {
      results.push({
        title: 'House Rules',
        description: 'Important guidelines for your stay',
        path: `/guest/${propertyId}/house-rules`
      })
    }
    
    // Search in host's house rules
    propertyDetails.houseRules.forEach(rule => {
      if (rule.title.toLowerCase().includes(query)) {
        results.push({
          title: rule.title,
          description: 'House rule set by the host',
          path: `/guest/${propertyId}/house-rules`
        })
      }
    })

    // Search in host's "How Things Work" articles
    if ('how things work'.includes(query) || 'appliances'.includes(query) || 'how to use'.includes(query)) {
      results.push({
        title: 'How Things Work',
        description: 'Help with appliances and home equipment',
        path: `/guest/${propertyId}/how-things-work`
      })
    }

    propertyDetails.howThingsWork.forEach(article => {
      if (
        article.title.toLowerCase().includes(query) || 
        (article.description && article.description.toLowerCase().includes(query))
      ) {
        results.push({
          title: article.title,
          description: article.description || 'How to use appliances in this property',
          path: `/guest/${propertyId}/how-things-work`
        })
      }
    })

    // Search in host's "Before You Leave Home" articles
    if ('before leaving'.includes(query) || 'check out'.includes(query) || 'departure'.includes(query)) {
      results.push({
        title: 'Before You Leave Home',
        description: 'Essential information for your departure',
        path: `/guest/${propertyId}/before-leaving`
      })
    }

    propertyDetails.beforeLeaving.forEach(article => {
      if (
        article.title.toLowerCase().includes(query) || 
        (article.description && article.description.toLowerCase().includes(query))
      ) {
        results.push({
          title: article.title,
          description: article.description || 'Information for before your departure',
          path: `/guest/${propertyId}/before-leaving`
        })
      }
    })
    
    // Add property info
    if (propertyName.toLowerCase().includes(query) || 'accommodation'.includes(query) || 'stay'.includes(query)) {
      results.push({
        title: propertyName,
        description: 'Information about your accommodation',
        path: `/guest/${propertyId}/house-info`
      })
    }
    
    // Add map
    if ('map'.includes(query) || 'location'.includes(query) || 'directions'.includes(query)) {
      results.push({
        title: 'Map & Location',
        description: 'Find your way around',
        path: `/guest/${propertyId}/map`
      })
    }
    
    // Add contacts
    if ('contacts'.includes(query) || 'host'.includes(query) || 'contact'.includes(query) || 'call'.includes(query)) {
      results.push({
        title: 'Contact Host',
        description: 'Get in touch with your host',
        path: `/guest/${propertyId}/contacts`
      })
    }
    
    // Add wifi
    if ('wifi'.includes(query) || 'internet'.includes(query) || 'connection'.includes(query)) {
      results.push({
        title: 'Wifi Connection',
        description: 'Connect to the internet',
        path: `/guest/${propertyId}/wifi-connection`
      })
    }
    
    // City guide
    if ('city'.includes(query) || 'guide'.includes(query) || 'attractions'.includes(query) || 'tourism'.includes(query)) {
      results.push({
        title: propertyDetails.cityGuideTitle || 'City Guide',
        description: 'Explore the city with local recommendations',
        path: `/guest/${propertyId}/city-guide`
      })
    }
    
    // Weather related
    if ('weather'.includes(query) || 'forecast'.includes(query) || 'temperature'.includes(query)) {
      results.push({
        title: 'Weather Information',
        description: 'Current weather and forecast',
        path: `/guest/${propertyId}`
      })
    }
    
    // If city name is included in search
    if (propertyCity.toLowerCase().includes(query)) {
      results.push({
        title: `${propertyCity} Information`,
        description: 'Information about the city',
        path: `/guest/${propertyId}/city-guide`
      })
      
      results.push({
        title: `Weather in ${propertyCity}`,
        description: 'Current weather and forecast',
        path: `/guest/${propertyId}`
      })
    }
    
    // Set search results and show them
    setSearchResults(results)
    setShowSearchResults(true)
  }
  
  // Function to clear search results
  const clearSearch = () => {
    setSearchQuery('')
    setShowSearchResults(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm py-3">
        <div className="w-full px-4 flex items-center justify-between">
          <div className="relative h-12 w-36">
            <Image 
              src="/images/logo_guest.png"
              alt="Guestify Logo"
              fill
              className="object-contain object-left"
              style={{ objectFit: 'contain', objectPosition: 'left' }}
            />
          </div>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="flex-grow w-full px-4 pt-4 pb-14 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="w-full flex flex-col space-y-5 flex-grow">
            {/* Search bar */}
            <div className="relative w-full">
              <form onSubmit={handleSearch} className="w-full">
                <input
                  type="text"
                  placeholder="Search for information, services or rules..."
                  className="w-full p-2.5 pl-10 pr-4 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-[#5E2BFF] text-sm text-gray-800"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Auto-search while typing with a small delay
                    if (e.target.value.trim().length > 1) {
                      // Only search if 2+ characters (modificato da 3+ a 2+)
                      handleSearch(e as any);
                    } else if (e.target.value.trim().length === 0) {
                      setShowSearchResults(false);
                    }
                  }}
                />
                <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {searchQuery && (
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={clearSearch}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
              
              {/* Search Results */}
              {showSearchResults && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  {searchResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <Link 
                          href={result.path} 
                          key={index}
                          className="block hover:bg-gray-50 p-3 border-b border-gray-100 last:border-b-0"
                          onClick={clearSearch}
                        >
                          <div className="text-sm font-bold text-gray-800">{result.title}</div>
                          <div className="text-xs text-gray-500">{result.description}</div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Essentials section */}
            <div>
              <h2 className="text-base font-bold text-[#5E2BFF] mb-3">Essentials</h2>
              <div className="grid grid-cols-4 gap-2">
                {essentials.map((item) => (
                  <Link href={item.path} key={item.id} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-1 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-700 block font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Main section with all buttons */}
            <div className="flex flex-col space-y-3 w-full">
              {/* Extra Services */}
              <Link href={`/guest/${propertyId}/extra-services`} className="block w-full">
                <div className="bg-[#5E2BFF] text-white rounded-xl p-4 shadow-sm w-full">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Extra Services</h2>
                      <p className="text-xs text-white opacity-80">Discover available additional services</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Four center buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <Link href={`/guest/${propertyId}/how-things-work`} className="w-full">
                  <div className="bg-purple-100 rounded-xl p-4 shadow-sm border border-purple-200 w-full h-full">
                    <div className="mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">How Things Work</h2>
                    <p className="text-xs text-gray-600">Help with appliances</p>
                  </div>
                </Link>
                <Link href={`/guest/${propertyId}/before-leaving`} className="w-full">
                  <div className="bg-pink-100 rounded-xl p-4 shadow-sm border border-pink-200 w-full h-full">
                    <div className="mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Before You Leave Home</h2>
                    <p className="text-xs text-gray-600">Essential informations before the trip</p>
                  </div>
                </Link>
                <Link href={`/guest/${propertyId}/city-guide`} className="w-full">
                  <div className="bg-[#ffde59] rounded-xl p-4 shadow-sm border border-yellow-300 w-full h-full">
                    <div className="mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Host Guides</h2>
                    <p className="text-xs text-gray-600">Guides and recommendations</p>
                  </div>
                </Link>
                <Link href={`/guest/${propertyId}/book-again`} className="w-full">
                  <div className="bg-green-100 rounded-xl p-4 shadow-sm border border-green-200 w-full h-full">
                    <div className="mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Book Again</h2>
                    <p className="text-xs text-gray-600">Reserve your next stay</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Weather Information */}
            {weatherData && (
              <div className="w-full mt-auto">
                <h2 className="text-base font-bold text-[#5E2BFF] mb-2">Weather in {weatherData.city}</h2>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden text-white shadow-sm w-full">
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold">{weatherData.date}</h3>
                        <p className="text-xs opacity-90">{weatherData.city}</p>
                      </div>
                      <div className="text-3xl">{weatherData.icon}</div>
                    </div>
                    <div className="mt-1 flex items-end">
                      <span className="text-3xl font-bold">{weatherData.temperature}°C</span>
                      <span className="ml-2 text-xs opacity-90">{weatherData.condition}</span>
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

      {/* Navigation bar */}
      <nav className="bg-white border-t shadow-lg fixed bottom-0 left-0 right-0 w-full">
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