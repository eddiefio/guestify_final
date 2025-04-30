'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface CheckoutInfo {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface CheckoutPhoto {
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

// Funzione per trasformare gli URL in link cliccabili
function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#5E2BFF; text-decoration:underline;">${url}</a>`
  )
}

export default function CheckoutInformationGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [checkoutInfo, setCheckoutInfo] = useState<{[key: string]: string}>({})
  const [photos, setPhotos] = useState<{
    checkout_time: CheckoutPhoto[]
    checkout_process: CheckoutPhoto[]
  }>({
    checkout_time: [],
    checkout_process: []
  })
  const [activeSection, setActiveSection] = useState<'checkout_time' | 'checkout_process'>('checkout_time')

  useEffect(() => {
    if (!propertyId) return

    const fetchCheckoutInfo = async () => {
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
        
        // Fetch checkout information
        const { data: checkoutData, error: checkoutError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'checkout_information')
        
        if (checkoutError && checkoutError.code !== 'PGRST116') throw checkoutError
        
        const infoMap: {[key: string]: string} = {}
        
        if (checkoutData && checkoutData.length > 0) {
          checkoutData.forEach((item: CheckoutInfo) => {
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
        
        setCheckoutInfo(infoMap)
        
        // Fetch photos for each section
        const { data: photosData, error: photosError } = await supabase
          .from('checkout_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (photosError && photosError.code !== 'PGRST116') throw photosError
        
        const photosMap = {
          checkout_time: [] as CheckoutPhoto[],
          checkout_process: [] as CheckoutPhoto[]
        }
        
        if (photosData) {
          photosData.forEach((photo: CheckoutPhoto) => {
            if (photo.section_type === 'checkout_time' || photo.section_type === 'checkout_process') {
              photosMap[photo.section_type].push(photo)
            }
          })
        }
        
        setPhotos(photosMap)
        
      } catch (error) {
        console.error('Error fetching checkout information:', error)
        setError('Could not load check-out information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCheckoutInfo()
  }, [propertyId])

  const getSectionTitle = (sectionType: string): string => {
    switch (sectionType) {
      case 'checkout_time':
        return 'Check-out Time'
      case 'checkout_process':
        return 'Check-out Process'
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
            <h1 className="text-xl font-bold text-gray-800">Check-out Information</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading check-out information...</p>
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
                Check-out at {propertyName}
              </h2>
            </div>

            {/* Tab navigation */}
            <div className="grid grid-cols-2 gap-2 md:gap-6 mb-8">
              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-4 cursor-pointer h-full flex flex-col items-center justify-center ${activeSection === 'checkout_time' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                onClick={() => setActiveSection('checkout_time')}
              >
                <div className="text-yellow-500 mb-1 md:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-sm font-bold text-gray-800 text-center">Check-out Time</h2>
              </div>

              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-4 cursor-pointer h-full flex flex-col items-center justify-center ${activeSection === 'checkout_process' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                onClick={() => setActiveSection('checkout_process')}
              >
                <div className="text-green-500 mb-1 md:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-sm font-bold text-gray-800 text-center">Check-out Process</h2>
              </div>
            </div>

            {/* Section content */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {getSectionTitle(activeSection)}
                </h3>

                {checkoutInfo[activeSection] ? (
                  <div className="prose max-w-none mb-8">
                    {activeSection === 'checkout_process' ? (
                      <p
                        className="text-gray-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: linkify(checkoutInfo[activeSection]!) }}
                      />
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {checkoutInfo[activeSection]}
                      </p>
                    )}
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