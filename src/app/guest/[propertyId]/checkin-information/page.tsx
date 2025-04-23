'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface CheckinInfo {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface CheckinPhoto {
  id: string
  property_id: string
  section_type: string
  photo_url: string
  description: string | null
  display_order: number
  created_at: string
}

interface ParsedContent {
  subtype: string
  content: string
}

export default function CheckinInformationGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [checkinInfo, setCheckinInfo] = useState<{
    access_and_keys?: string
    checkin_time?: string
    parking_info?: string
  }>({})
  const [photos, setPhotos] = useState<{
    access_and_keys: CheckinPhoto[]
    checkin_time: CheckinPhoto[]
    parking_info: CheckinPhoto[]
  }>({
    access_and_keys: [],
    checkin_time: [],
    parking_info: []
  })
  const [activeSection, setActiveSection] = useState<'access_and_keys' | 'checkin_time' | 'parking_info'>('access_and_keys')

  useEffect(() => {
    if (!propertyId) return

    const fetchCheckinInfo = async () => {
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
        
        // Fetch checkin information
        const { data: checkinData, error: checkinError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'checkin_information')
        
        if (checkinError && checkinError.code !== 'PGRST116') throw checkinError
        
        const infoMap: {[key: string]: string} = {}
        
        if (checkinData && checkinData.length > 0) {
          checkinData.forEach((item: CheckinInfo) => {
            try {
              // Try to parse content as JSON
              const parsedContent = JSON.parse(item.content) as ParsedContent
              if (parsedContent && parsedContent.subtype && parsedContent.content) {
                infoMap[parsedContent.subtype] = parsedContent.content
              }
            } catch (e) {
              // If parsing fails, it might be in old format
              console.warn('Failed to parse content as JSON', e)
            }
          })
        }
        
        setCheckinInfo(infoMap)
        
        // Fetch photos for each section
        const { data: photosData, error: photosError } = await supabase
          .from('checkin_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (photosError && photosError.code !== 'PGRST116') throw photosError
        
        const photosMap = {
          access_and_keys: [] as CheckinPhoto[],
          checkin_time: [] as CheckinPhoto[],
          parking_info: [] as CheckinPhoto[]
        }
        
        if (photosData) {
          photosData.forEach((photo: CheckinPhoto) => {
            if (photo.section_type === 'access_and_keys' || 
                photo.section_type === 'checkin_time' || 
                photo.section_type === 'parking_info') {
              photosMap[photo.section_type].push(photo)
            }
          })
        }
        
        setPhotos(photosMap)
        
      } catch (error) {
        console.error('Error fetching checkin information:', error)
        setError('Could not load check-in information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCheckinInfo()
  }, [propertyId])

  const getSectionTitle = (sectionType: string): string => {
    switch (sectionType) {
      case 'access_and_keys':
        return 'Access & Keys'
      case 'checkin_time':
        return 'Check-in Time'
      case 'parking_info':
        return 'Parking Information'
      default:
        return sectionType
    }
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
            <h1 className="text-xl font-bold text-gray-800">Check-in Information</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading check-in information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Information Not Available</h2>
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Check-in at {propertyName}
              </h2>
            </div>

            {/* Tab navigation */}
            <div className="mb-6 flex overflow-x-auto scrollbar-hide border-b border-gray-200">
              {(['access_and_keys', 'checkin_time', 'parking_info'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex-shrink-0 px-5 py-3 font-semibold text-sm rounded-t-lg mr-1 ${
                    activeSection === section
                      ? 'bg-[#5E2BFF] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {getSectionTitle(section)}
                </button>
              ))}
            </div>

            {/* Section content */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {getSectionTitle(activeSection)}
                </h3>

                {checkinInfo[activeSection] ? (
                  <div className="prose max-w-none mb-8">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {checkinInfo[activeSection]}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 mb-8">
                    <p className="text-gray-500">No information available for this section.</p>
                  </div>
                )}

                {/* Photos for this section */}
                {photos[activeSection] && photos[activeSection].length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Photos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {photos[activeSection].map((photo) => (
                        <div key={photo.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="aspect-w-16 aspect-h-9 relative">
                            <img
                              src={photo.photo_url}
                              alt={photo.description || `${getSectionTitle(activeSection)} photo`}
                              className="object-cover w-full h-full rounded-t-lg"
                            />
                          </div>
                          {photo.description && (
                            <div className="p-3">
                              <p className="text-sm text-gray-700">{photo.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-4">
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