'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface TransportOption {
  id: string
  property_id: string
  type: string
  name: string
  description: string
  distance: string
  cost: string | null
  created_at: string
}

export default function TransportationGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [transportationOptions, setTransportationOptions] = useState<TransportOption[]>([])

  useEffect(() => {
    if (!propertyId) return

    const fetchTransportationInfo = async () => {
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
        
        // Fetch transportation options
        const { data: transportData, error: transportError } = await supabase
          .from('transportation_options')
          .select('*')
          .eq('property_id', propertyId)
          .order('type', { ascending: true })
        
        if (transportError) throw transportError
        
        setTransportationOptions(transportData || [])
        
      } catch (error) {
        console.error('Error fetching transportation info:', error)
        setError('Could not load transportation information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTransportationInfo()
  }, [propertyId])

  // Group transportation options by type
  const groupedTransportation = transportationOptions.reduce((acc, option) => {
    if (!acc[option.type]) {
      acc[option.type] = []
    }
    acc[option.type].push(option)
    return acc
  }, {} as Record<string, TransportOption[]>)
  
  // Get icon for transport type
  const getIconForType = (type: string) => {
    switch(type.toLowerCase()) {
      case 'airport':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )
      case 'train':
      case 'train station':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'bus':
      case 'bus stop':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'subway':
      case 'metro':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'taxi':
      case 'rideshare':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )
      case 'parking':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        )
      case 'car rental':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        )
      case 'bike rental':
      case 'bicycle rental':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  // Format category names for display
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
            <h1 className="text-xl font-bold text-gray-800">Transportation Options</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading transportation information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Transportation Information Not Available</h2>
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
          <div className="max-w-2xl mx-auto">
            {/* Property name */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Transportation options near your stay
              </p>
            </div>

            {transportationOptions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Transportation Information</h3>
                <p className="text-gray-600">
                  The host has not added any transportation options yet. Please contact your host directly for information about getting around.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-[#5E2BFF] p-6">
                  <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Render each transport type in its own section */}
                  {Object.entries(groupedTransportation).map(([type, options]) => (
                    <div key={type} className="mb-8">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        {getIconForType(type)}
                        <span className="ml-2">{formatCategory(type)}</span>
                      </h3>
                      
                      <div className="space-y-4">
                        {options.map(option => (
                          <div key={option.id} className="bg-gray-50 p-5 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800">{option.name}</h4>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{option.description}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="text-sm font-medium text-gray-500">Distance</div>
                                <div className="font-semibold text-gray-800">{option.distance}</div>
                                
                                {option.cost && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium text-gray-500">Cost</div>
                                    <div className="font-semibold text-gray-800">{option.cost}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        Distances and times are estimates. Please verify current schedules and availability.
                      </p>
                    </div>
                  </div>
                </div>
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