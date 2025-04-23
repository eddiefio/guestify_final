'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Calendar, ExternalLink } from 'lucide-react'

interface BookAgainInfo {
  id: string
  property_id: string
  section_type: string
  content: string
  image_url?: string
  created_at: string
  updated_at: string
}

interface PropertyLink {
  id: string
  property_id: string
  title: string
  url: string
}

export default function BookAgainPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null)
  const [guests, setGuests] = useState(2)
  const [bookAgainInfo, setBookAgainInfo] = useState<{text: string, image_url: string | null} | null>(null)
  const [propertyLinks, setPropertyLinks] = useState<PropertyLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Mock calendar data - would come from a real booking API
  const unavailableDates = ['2023-06-10', '2023-06-11', '2023-06-12', '2023-06-20', '2023-06-21']
  
  useEffect(() => {
    const fetchBookAgainData = async () => {
      try {
        setLoading(true)
        
        // Fetch book again info
        const { data: bookAgainData, error: bookAgainError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'book_again')
          .single()
        
        if (bookAgainError && bookAgainError.code !== 'PGRST116') {
          throw bookAgainError
        }
        
        if (bookAgainData) {
          try {
            // Parse JSON data from content field
            const parsedData = JSON.parse(bookAgainData.content)
            setBookAgainInfo(parsedData)
          } catch (e) {
            console.error('Failed to parse book again data:', e)
            setBookAgainInfo(null)
          }
        }

        // Fetch property listing links
        const { data: linksData, error: linksError } = await supabase
          .from('property_listing_links')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: true })
        
        if (linksError) throw linksError
        
        if (linksData && linksData.length > 0) {
          setPropertyLinks(linksData)
        }

      } catch (error: any) {
        console.error('Error fetching book again data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchBookAgainData()
    }
  }, [propertyId])

  const handleBooking = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      alert('This would redirect to the booking service with your selected dates')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm py-3">
        <div className="w-full px-4 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Book Again</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5E2BFF]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {bookAgainInfo?.image_url && (
              <div className="mb-6">
                <div className="relative w-full h-48 rounded-xl overflow-hidden">
                  <img 
                    src={bookAgainInfo.image_url}
                    alt="Property Image"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            {bookAgainInfo?.text && (
              <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Information about booking again</h2>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {bookAgainInfo.text}
                </div>
              </div>
            )}

            {propertyLinks.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Booking Links</h2>
                <div className="space-y-3">
                  {propertyLinks.map((link, index) => (
                    <div key={link.id || index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="text-[#5E2BFF] mr-3">
                        <ExternalLink size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{link.title}</h3>
                      </div>
                      <button
                        className="ml-2 bg-[#5E2BFF] text-white px-3 py-1 rounded text-sm font-medium hover:bg-purple-700 transition duration-200"
                        onClick={() => handleBooking(link.url)}
                      >
                        Visit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start">
                <div className="text-yellow-500 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Returning Guest Discount</h3>
                  <p className="text-sm text-yellow-700">You may be eligible for a discount as a returning guest. Contact the host for details!</p>
                </div>
              </div>
            </div>
          </>
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