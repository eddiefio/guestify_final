'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface CheckoutInfo {
  id: string
  property_id: string
  checkout_time: string
  checkout_instructions: string
  key_return: string
  cleaning_requirements: string
  special_instructions: string
  late_checkout_available: boolean
  late_checkout_fee: number
  created_at: string
}

export default function CheckoutInformationPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  
  const checkoutSteps = [
    {
      title: "Clean Up",
      description: "Remove trash and leave the space tidy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    {
      title: "Turn Off Appliances",
      description: "Switch off lights, AC, and all electronics",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Close Windows",
      description: "Ensure all windows and doors are properly closed",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      title: "Return Keys",
      description: "Leave keys in the designated location",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      )
    }
  ]

  useEffect(() => {
    const fetchCheckoutInfo = async () => {
      try {
        setLoading(true)
        
        // Recupera le informazioni sul checkout per la proprietà
        const { data, error: checkoutError } = await supabase
          .from('checkout_info')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (checkoutError) {
          console.error('Error fetching checkout information:', checkoutError)
          throw new Error('Unable to load check-out information. Please try again later.')
        }
        
        setCheckoutInfo(data)
        setLoading(false)
      } catch (error: any) {
        console.error('Error in fetch checkout info:', error)
        setError(error.message)
        setLoading(false)
      }
    }
    
    fetchCheckoutInfo()
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
          <h1 className="text-xl font-bold text-gray-800">Check-out Information</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading check-out information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : !checkoutInfo ? (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6">
            No check-out information has been provided for this property.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#ffde59] rounded-xl p-5 shadow-sm">
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Check-out Time</h2>
              <p className="text-xl font-bold text-gray-800">{checkoutInfo.checkout_time || '11:00 AM'}</p>
              <p className="text-sm text-gray-700 mt-2">
                Please respect the check-out time. Late check-out may result in additional fees.
              </p>
              
              {checkoutInfo.late_checkout_available && (
                <div className="mt-3 bg-white bg-opacity-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">
                    Late check-out is available for an additional fee of ${checkoutInfo.late_checkout_fee}. 
                    Please contact the host for arrangements.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Check-out Procedure</h2>
              
              <div className="space-y-4">
                {checkoutSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={`border rounded-lg p-4 flex items-start cursor-pointer ${
                      activeStep === index ? 'bg-purple-50 border-purple-200' : 'border-gray-200'
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      activeStep === index ? 'bg-[#5E2BFF] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        activeStep === index ? 'bg-[#5E2BFF] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Additional Instructions</h2>
              
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Checkout Instructions</label>
                  <p className="text-gray-700">{checkoutInfo.checkout_instructions}</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Key Return</label>
                  <p className="text-gray-700">{checkoutInfo.key_return}</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Cleaning Requirements</label>
                  <p className="text-gray-700">{checkoutInfo.cleaning_requirements}</p>
                </div>
                
                {checkoutInfo.special_instructions && (
                  <div>
                    <label className="block text-sm font-medium text-[#5E2BFF] mb-1">Special Instructions</label>
                    <p className="text-gray-700">{checkoutInfo.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-xl p-5 shadow-sm border border-blue-200">
              <h2 className="text-base font-bold text-blue-800 mb-2">Checkout Checklist</h2>
              <p className="text-sm text-blue-700 mb-3">
                Make your checkout smoother by using our checklist to ensure you've completed all necessary steps.
              </p>
              <Link href={`/guest/${propertyId}/before-leaving`} className="text-[#5E2BFF] font-medium text-sm hover:underline">
                View Checkout Checklist →
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