'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function HowThingsWorkPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string

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
          <h1 className="text-xl font-bold text-gray-800">How Things Work</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Kitchen Appliances</h2>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-medium text-gray-800 mb-1">Coffee Machine</h3>
              <p className="text-sm text-gray-600">
                1. Fill the water tank at the back<br/>
                2. Add coffee to the filter<br/>
                3. Press the top button to start brewing
              </p>
            </div>
            <div className="border-b pb-3">
              <h3 className="font-medium text-gray-800 mb-1">Dishwasher</h3>
              <p className="text-sm text-gray-600">
                1. Load dishes in the racks<br/>
                2. Add detergent to the dispenser<br/>
                3. Select program and press start button
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Oven</h3>
              <p className="text-sm text-gray-600">
                1. Select temperature using left knob<br/>
                2. Choose program with right knob<br/>
                3. The light will turn off when preheated
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Entertainment</h2>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-medium text-gray-800 mb-1">TV Remote</h3>
              <p className="text-sm text-gray-600">
                1. Use the red power button to turn on/off<br/>
                2. Source button to switch between HDMI inputs<br/>
                3. Netflix button for direct access
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Bluetooth Speaker</h3>
              <p className="text-sm text-gray-600">
                1. Hold power button for 3 seconds<br/>
                2. Select "Guest Speaker" on your device<br/>
                3. Default pairing code is 0000
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Heating & Cooling</h2>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-medium text-gray-800 mb-1">Air Conditioning</h3>
              <p className="text-sm text-gray-600">
                1. Press power button on remote<br/>
                2. Set desired temperature with up/down arrows<br/>
                3. Choose mode: cool, heat, or fan
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Floor Heating</h3>
              <p className="text-sm text-gray-600">
                1. Use the thermostat on the wall in the hallway<br/>
                2. Set temperature between 20-23°C for comfort<br/>
                3. Takes about 30 minutes to warm up
              </p>
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