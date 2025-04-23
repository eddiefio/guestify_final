'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

interface Guide {
  id: string
  property_id: string
  title: string
  description: string | null
  category: 'restaurant' | 'attraction' | 'transport' | 'shopping' | 'other'
  image_url: string | null
  address: string | null
  phone: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export default function CityGuidePage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [activeCategory, setActiveCategory] = useState<Guide['category'] | 'all'>('all')
  
  useEffect(() => {
    if (!propertyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        setProperty(propertyData)
        
        // Fetch city guides
        const { data: guidesData, error: guidesError } = await supabase
          .from('city_guides')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (guidesError) throw guidesError
        
        setGuides(guidesData || [])
        
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Could not load city guide information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [propertyId])
  
  const filteredGuides = activeCategory === 'all' 
    ? guides 
    : guides.filter(guide => guide.category === activeCategory)
    
  const categoryLabels: Record<Guide['category'] | 'all', string> = {
    all: 'All',
    restaurant: 'Restaurants',
    attraction: 'Attractions',
    transport: 'Transport',
    shopping: 'Shopping',
    other: 'Other'
  }
  
  const getCategoryIcon = (category: Guide['category'] | 'all') => {
    switch(category) {
      case 'restaurant':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'attraction':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        )
      case 'transport':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      case 'shopping':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
      case 'all':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm py-3">
        <div className="w-full px-4 flex items-center">
          <button 
            onClick={() => router.push(`/guest/${propertyId}`)} 
            className="mr-4 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Host Guides</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading city guide...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Guide Not Available</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => router.push(`/guest/${propertyId}`)}
                className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-lg font-bold text-gray-700 mb-2">No Guides Available</h3>
              <p className="text-gray-600">
                Your host hasn't added any city guides yet.
              </p>
              <button
                onClick={() => router.push(`/guest/${propertyId}`)}
                className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* City name and introduction */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {property?.city || 'City'} Host Guides
              </h2>
              <p className="text-gray-600 mt-1">
                Discover the best local spots recommended by your host
              </p>
            </div>
            
            {/* Category filters */}
            <div className="flex overflow-x-auto scrollbar-hide space-x-2 mb-6 pb-2">
              {(['all', ...Array.from(new Set(guides.map(guide => guide.category)))] as Array<Guide['category'] | 'all'>).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                    activeCategory === category
                      ? 'bg-[#5E2BFF] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1.5">{getCategoryIcon(category)}</span>
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
            
            {/* Guides list */}
            <div className="space-y-4">
              {filteredGuides.map((guide) => (
                <div key={guide.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {guide.image_url && (
                    <div className="h-48 w-full relative">
                      <img 
                        src={guide.image_url} 
                        alt={guide.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{guide.title}</h3>
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
                          {categoryLabels[guide.category]}
                        </span>
                      </div>
                    </div>
                    
                    {guide.description && (
                      <p className="text-gray-600 mt-3 text-sm">{guide.description}</p>
                    )}
                    
                    {/* Details section */}
                    <div className="mt-4 space-y-2">
                      {guide.address && (
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm text-gray-600">{guide.address}</p>
                        </div>
                      )}
                      
                      {guide.phone && (
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p className="text-sm text-gray-600">{guide.phone}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Website link */}
                    {guide.website && (
                      <a 
                        href={guide.website.startsWith('http') ? guide.website : `https://${guide.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block bg-[#5E2BFF] text-white py-2 rounded-lg text-center hover:bg-opacity-90 transition"
                      >
                        Visit Website
                      </a>
                    )}
                    
                    {/* Map link */}
                    {guide.address && (
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(guide.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block bg-gray-100 text-gray-800 py-2 rounded-lg text-center hover:bg-gray-200 transition"
                      >
                        View on Map
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

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