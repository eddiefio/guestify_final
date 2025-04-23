'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'

interface CheckInInfo {
  id: string
  property_id: string
  check_in_time: string
  check_out_time: string
  check_in_instructions: string
  special_instructions: string | null
  created_at: string
}

export default function CheckInGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo | null>(null)

  useEffect(() => {
    if (!propertyId) return

    const fetchCheckInInfo = async () => {
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
        
        // Fetch check-in info
        const { data: checkInData, error: checkInError } = await supabase
          .from('check_in_info')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (checkInError && checkInError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which we handle separately
          throw checkInError
        }
        
        setCheckInInfo(checkInData || null)
        
      } catch (error) {
        console.error('Error fetching check-in info:', error)
        setError('Could not load check-in information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCheckInInfo()
  }, [propertyId])

  // Format time from "14:00:00" to "2:00 PM"
  const formatTime = (timeString: string) => {
    try {
      // Create a date object with the time
      const [hours, minutes] = timeString.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0)
      
      // Format the time
      return format(date, 'h:mm a')
    } catch (error) {
      return timeString
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
              <h2 className="text-lg font-bold text-gray-800 mb-2">Check-in Information Not Available</h2>
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
                Check-in information for your stay
              </p>
            </div>

            {!checkInInfo ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Check-in Information</h3>
                <p className="text-gray-600">
                  The host has not added any check-in information yet. Please contact your host directly for details on how to check in.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-[#5E2BFF] p-6">
                  <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Check-in and Check-out times */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <div className="flex mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-800">Check-in</h3>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 ml-8">{formatTime(checkInInfo.check_in_time)}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <div className="flex mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-800">Check-out</h3>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 ml-8">{formatTime(checkInInfo.check_out_time)}</p>
                    </div>
                  </div>
                  
                  {/* Check-in instructions */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check-in Instructions
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{checkInInfo.check_in_instructions}</p>
                    </div>
                  </div>
                  
                  {/* Special instructions (if any) */}
                  {checkInInfo.special_instructions && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Special Instructions
                      </h3>
                      <div className="bg-yellow-50 p-5 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{checkInInfo.special_instructions}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        If you have any issues with check-in, please contact your host directly for assistance.
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