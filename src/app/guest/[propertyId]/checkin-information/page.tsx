'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface CheckinInfo {
  id: string
  property_id: string
  checkin_time: string
  checkin_instructions: string
  key_location: string
  host_greeter: boolean
  greeter_contact: string
  special_instructions: string
  created_at: string
}

export default function CheckinInformationPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [checkinInfo, setCheckinInfo] = useState<CheckinInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCheckinInfo = async () => {
      try {
        setLoading(true)
        
        // Recupera le informazioni sul check-in per la proprietà
        const { data, error: checkinError } = await supabase
          .from('checkin_info')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (checkinError) {
          console.error('Error fetching checkin information:', checkinError)
          throw new Error('Unable to load check-in information. Please try again later.')
        }
        
        setCheckinInfo(data)
        setLoading(false)
      } catch (error: any) {
        console.error('Error in fetch checkin info:', error)
        setError(error.message)
        setLoading(false)
      }
    }
    
    fetchCheckinInfo()
  }, [propertyId])

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
          <h1 className="text-xl font-bold text-gray-800">Check-in Information</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading check-in information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : !checkinInfo ? (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6">
            No check-in information has been provided for this property.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#5E2BFF] text-white rounded-xl p-5 shadow-sm">
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#ffde59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-1">Check-in Time</h2>
              <p className="text-xl font-bold">{checkinInfo.checkin_time || 'Flexible'}</p>
              <p className="text-sm opacity-80 mt-2">
                Please respect the check-in time. If you need an early check-in, please contact the host in advance.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Check-in Instructions</h2>
              
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-medium text-[#5E2BFF] mb-1">How to Check In</label>
                  <p className="text-gray-700">{checkinInfo.checkin_instructions}</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Key Location</label>
                  <p className="text-gray-700">{checkinInfo.key_location}</p>
                </div>
                
                {checkinInfo.host_greeter && (
                  <div className="border-b border-gray-100 pb-4">
                    <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Greeter Contact</label>
                    <p className="text-gray-700">{checkinInfo.greeter_contact}</p>
                    <div className="mt-2 flex items-center">
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        In-person check-in available
                      </div>
                    </div>
                  </div>
                )}
                
                {checkinInfo.special_instructions && (
                  <div>
                    <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Special Instructions</label>
                    <p className="text-gray-700">{checkinInfo.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Directions</h2>
              
              <div className="bg-gray-100 h-44 rounded-lg relative overflow-hidden mb-4">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
              
              <Link href={`/guest/${propertyId}/map`} className="block w-full">
                <button className="w-full bg-[#5E2BFF] text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200">
                  Get Directions
                </button>
              </Link>
            </div>
            
            <div className="bg-green-100 rounded-xl p-5 shadow-sm border border-green-200">
              <h2 className="text-base font-bold text-green-800 mb-2">Need Help?</h2>
              <p className="text-sm text-green-700 mb-3">
                If you have any issues during check-in, please contact the host directly.
              </p>
              <Link href={`/guest/${propertyId}/contacts`} className="text-[#5E2BFF] font-medium text-sm hover:underline">
                View Contact Information →
              </Link>
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