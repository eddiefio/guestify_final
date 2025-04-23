'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'

interface WiFiCredentials {
  id: string
  property_id: string
  ssid: string
  password: string
  encryption_type: string
  created_at: string
}

export default function WiFiConnectionPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [wifiData, setWifiData] = useState<WiFiCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Genera il string di connessione WiFi per il QR code
  const generateWifiQRString = (ssid: string, password: string, encryption: string) => {
    return `WIFI:S:${ssid};T:${encryption || 'WPA'};P:${password};;`
  }
  
  const copyPassword = () => {
    if (wifiData?.password) {
      navigator.clipboard.writeText(wifiData.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    const fetchWifiData = async () => {
      try {
        setLoading(true)
        
        // Recupera le credenziali WiFi per la proprietà
        const { data, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (wifiError) {
          console.error('Error fetching WiFi data:', wifiError)
          throw new Error('Unable to load WiFi information. Please try again later.')
        }
        
        setWifiData(data)
        setLoading(false)
      } catch (error: any) {
        console.error('Error in fetch WiFi data:', error)
        setError(error.message)
        setLoading(false)
      }
    }
    
    fetchWifiData()
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
          <h1 className="text-xl font-bold text-gray-800">WiFi Connection</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading WiFi information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : !wifiData ? (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6">
            No WiFi information has been provided for this property.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Connect Automatically</h2>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your device's camera to connect automatically to the WiFi network.
              </p>
              
              <div className="flex justify-center bg-white p-4 rounded-lg mb-4">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <QRCode 
                    value={generateWifiQRString(wifiData.ssid, wifiData.password, wifiData.encryption_type)}
                    size={200}
                  />
                </div>
              </div>
              
              <p className="text-xs text-center text-gray-500 mb-4">
                Point your camera at the QR code and follow the prompts on your device
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Network Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                  <div className="flex">
                    <div className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">
                      {wifiData.ssid}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex">
                    <div className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">
                      {wifiData.password}
                    </div>
                    <button 
                      onClick={copyPassword}
                      className="ml-2 px-3 bg-[#5E2BFF] text-white rounded-lg flex items-center justify-center"
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Type</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">
                    {wifiData.encryption_type || 'WPA/WPA2'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-xl p-5 shadow-sm border border-blue-200">
              <h2 className="text-base font-bold text-blue-800 mb-2">Having Trouble?</h2>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li>Make sure you're within range of the WiFi router</li>
                <li>Restart your device's WiFi or try airplane mode on/off</li>
                <li>Some devices may need to enter the password manually</li>
                <li>If you still can't connect, please contact the host</li>
              </ul>
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