'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function BeforeLeavingPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [checklist, setChecklist] = useState({
    lights: false,
    windows: false,
    appliances: false,
    trash: false,
    keys: false,
    belongings: false
  })

  const handleCheck = (item: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const allChecked = Object.values(checklist).every(value => value)

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
          <h1 className="text-xl font-bold text-gray-800">Before You Leave</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Checkout Checklist</h2>
          <p className="text-sm text-gray-600 mb-4">Please check each item before you leave the apartment.</p>
          
          <div className="space-y-3">
            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.lights ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('lights')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.lights ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.lights && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Turn off all lights</h3>
                <p className="text-xs text-gray-500">Check all rooms including bathroom</p>
              </div>
            </div>

            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.windows ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('windows')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.windows ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.windows && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Close all windows</h3>
                <p className="text-xs text-gray-500">Don't forget balcony doors</p>
              </div>
            </div>

            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.appliances ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('appliances')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.appliances ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.appliances && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Turn off all appliances</h3>
                <p className="text-xs text-gray-500">Check stove, oven, coffee maker</p>
              </div>
            </div>

            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.trash ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('trash')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.trash ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.trash && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Take out all trash</h3>
                <p className="text-xs text-gray-500">Containers are located outside</p>
              </div>
            </div>

            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.keys ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('keys')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.keys ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.keys && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Return keys</h3>
                <p className="text-xs text-gray-500">Follow host instructions for key return</p>
              </div>
            </div>

            <div 
              className={`border rounded-lg p-3 flex items-center ${checklist.belongings ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              onClick={() => handleCheck('belongings')}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.belongings ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                {checklist.belongings && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Check for personal items</h3>
                <p className="text-xs text-gray-500">Look in drawers, cabinets, bathroom</p>
              </div>
            </div>
          </div>
        </div>

        {allChecked ? (
          <div className="bg-green-100 border border-green-200 rounded-xl p-4 text-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-green-800">All Set!</h2>
            <p className="text-sm text-green-700">You've completed all the checks. Have a safe journey!</p>
          </div>
        ) : (
          <div className="bg-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-bold text-blue-800 mb-2">Checkout Instructions</h2>
            <p className="text-sm text-blue-700 mb-2">Please leave the keys in the lockbox by the entrance.</p>
            <p className="text-sm text-blue-700">Checkout time: 11:00 AM</p>
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