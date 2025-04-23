'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface CityGuide {
  id: string
  property_id: string
  title: string
  file_path: string
  created_at: string
}

export default function GuestCityGuides() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guides, setGuides] = useState<CityGuide[]>([])
  const [propertyName, setPropertyName] = useState('')

  useEffect(() => {
    if (!propertyId) return

    const fetchCityGuides = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        setPropertyName(propertyData.name)
        
        // Fetch city guides
        const { data, error } = await supabase
          .from('city_guides')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setGuides(data || [])
        
      } catch (error) {
        console.error('Error fetching city guides:', error)
        setError('Could not load city guides')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCityGuides()
  }, [propertyId])

  // Funzione per ottenere l'URL pubblico del file
  const getFileUrl = (filePath: string) => {
    return supabase.storage.from('city-guides').getPublicUrl(filePath.replace('city-guides/', '')).data.publicUrl
  }

  // Funzione per verificare se un file è un'immagine
  const isImageFile = (filePath: string) => {
    const lowerPath = filePath.toLowerCase()
    return lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg') || 
           lowerPath.endsWith('.png') || lowerPath.endsWith('.gif') || 
           lowerPath.endsWith('.webp')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push(`/guest/${propertyId}`)}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Host Guides</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading guides...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Guides Not Available</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => router.push(`/guest/${propertyId}`)}
                className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Property name */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Host Guides for {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Discover your destination with these useful guides
              </p>
            </div>

            {guides.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Guides Available</h3>
                <p className="text-gray-600">
                  The host hasn't added any city guides yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {guides.map((guide) => (
                  <div key={guide.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col space-y-4">
                        {/* Titolo e data */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-800">{guide.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(guide.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Anteprima e pulsante */}
                        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                          {/* Anteprima */}
                          <div className="flex-shrink-0 w-full md:w-1/3 h-48 relative overflow-hidden rounded-lg border border-gray-200">
                            {isImageFile(guide.file_path) ? (
                              <Image 
                                src={getFileUrl(guide.file_path)} 
                                alt={guide.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="bg-gray-50 w-full h-full flex flex-col items-center justify-center p-4">
                                <svg className="w-20 h-20 text-[#5E2BFF]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                                  <path d="M3 8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                </svg>
                                <p className="mt-2 text-sm text-center text-gray-600">PDF Document</p>
                                <p className="text-xs text-center text-gray-500">Click View to open</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Descrizione e pulsante */}
                          <div className="flex-1 flex flex-col space-y-4">
                            <div className="text-gray-600 flex-grow">
                              <p>This guide provides valuable information about {propertyName} and surroundings.</p>
                            </div>
                            <a 
                              href={getFileUrl(guide.file_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-200 inline-flex items-center justify-center md:self-start"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Guide
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href={`/guest/${propertyId}`} className="text-[#5E2BFF] hover:underline">
                Back to All Services
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 