'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function BookAgainPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null)
  const [guests, setGuests] = useState(2)
  
  // Mock calendar data - would come from a real booking API
  const unavailableDates = ['2023-06-10', '2023-06-11', '2023-06-12', '2023-06-20', '2023-06-21']
  
  const handleBooking = () => {
    // This would redirect to the actual booking service
    alert('This would redirect to the booking service with your selected dates')
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

      <main className="flex-grow w-full px-4 py-6">
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Reserve Your Next Stay</h2>
          <p className="text-sm text-gray-600 mb-4">Enjoyed your stay? Book this property again for future visits.</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
              onChange={(e) => setSelectedDates(prev => ({start: e.target.value, end: prev?.end || ''}))}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
              onChange={(e) => setSelectedDates(prev => ({start: prev?.start || '', end: e.target.value}))}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
            <div className="flex items-center border rounded-lg bg-gray-50">
              <button 
                className="px-3 py-2 text-gray-700" 
                onClick={() => setGuests(prev => Math.max(1, prev - 1))}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="flex-grow text-center">{guests}</span>
              <button 
                className="px-3 py-2 text-gray-700" 
                onClick={() => setGuests(prev => prev + 1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              className="w-full bg-[#5E2BFF] text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200"
              onClick={handleBooking}
            >
              Check Availability
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Property Highlights</h2>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="text-[#5E2BFF] mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Great Location</h3>
                <p className="text-sm text-gray-600">Close to city center and major attractions</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="text-[#5E2BFF] mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Modern Amenities</h3>
                <p className="text-sm text-gray-600">Fully equipped kitchen and high-speed WiFi</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="text-[#5E2BFF] mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Great for Families</h3>
                <p className="text-sm text-gray-600">Spacious with amenities for children</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start">
            <div className="text-yellow-500 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Returning Guest Discount</h3>
              <p className="text-sm text-yellow-700">You're eligible for a 10% discount as a returning guest!</p>
            </div>
          </div>
        </div>
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