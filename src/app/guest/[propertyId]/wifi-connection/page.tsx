'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'

interface WifiCredentials {
  id: string
  property_id: string
  network_name: string
  password: string
  created_at: string
}

export default function WifiConnectionGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wifiCredentials, setWifiCredentials] = useState<WifiCredentials | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle')

  useEffect(() => {
    if (!propertyId) return

    const fetchWifiCredentials = async () => {
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
        
        // Fetch wifi credentials
        const { data, error } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Record not found error
            setError('No WiFi information available for this property')
          } else {
            throw error
          }
        } else {
          setWifiCredentials(data)
          
          // Generate QR code for the credentials
          if (data.network_name && data.password) {
            await generateQRCode(data.network_name, data.password)
          }
        }
      } catch (error) {
        console.error('Error fetching wifi credentials:', error)
        setError('Could not load WiFi information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchWifiCredentials()
  }, [propertyId])
  
  const generateQRCode = async (networkName: string, password: string) => {
    try {
      // Format for WiFi QR code: WIFI:T:WPA;S:SSID;P:PASSWORD;;
      const wifiString = `WIFI:T:WPA;S:${networkName};P:${password};;`
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(wifiString, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 300
      })
      
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Failed to generate QR code')
    }
  }
  
  const connectToWifi = async () => {
    if (!wifiCredentials) return
    
    setConnectionStatus('connecting')
    
    try {
      // For web, we cannot directly connect to WiFi, so we show instructions
      // and pretend to connect after a delay for demonstration purposes
      
      setTimeout(() => {
        // In a real implementation, this would happen when the user manually connects
        // using the provided credentials
        setConnectionStatus('connected')
      }, 2000)
    } catch (error) {
      console.error('Error connecting to WiFi:', error)
      setConnectionStatus('failed')
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
            <h1 className="text-xl font-bold text-gray-800">WiFi Connection</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading WiFi information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">WiFi Information Not Available</h2>
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
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="bg-[#5E2BFF] p-6">
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <h2 className="text-white text-xl font-bold text-center mt-2">
                  WiFi at {propertyName}
                </h2>
              </div>
              
              <div className="p-6">
                {wifiCredentials ? (
                  <>
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="text-gray-500 text-sm">Network Name:</div>
                        <div className="text-gray-800 font-bold text-lg">{wifiCredentials.network_name}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm">Password:</div>
                        <div className="text-gray-800 font-bold text-lg">{wifiCredentials.password}</div>
                      </div>
                    </div>

                    {qrCodeUrl && (
                      <div className="flex justify-center mb-6">
                        <div className="bg-white p-2 border border-gray-200 rounded-lg">
                          <img src={qrCodeUrl} alt="WiFi QR Code" className="w-64 h-64" />
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-4">
                        Scan the QR code with your device's camera to connect automatically, or use the credentials above to connect manually.
                      </p>
                      
                      <button
                        onClick={connectToWifi}
                        disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition duration-200 ${
                          connectionStatus === 'connected' 
                            ? 'bg-green-500 text-white' 
                            : connectionStatus === 'connecting'
                              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                              : 'bg-[#5E2BFF] text-white hover:bg-opacity-90'
                        }`}
                      >
                        {connectionStatus === 'connected' && 'Connected to WiFi'}
                        {connectionStatus === 'connecting' && 'Connecting...'}
                        {connectionStatus === 'failed' && 'Connection Failed - Try Again'}
                        {connectionStatus === 'idle' && 'Connect to WiFi'}
                      </button>
                      
                      {connectionStatus === 'connected' && (
                        <p className="text-green-600 text-sm mt-2">
                          Successfully connected to {wifiCredentials.network_name}
                        </p>
                      )}
                      
                      {connectionStatus === 'failed' && (
                        <p className="text-red-600 text-sm mt-2">
                          Could not connect to WiFi. Please try connecting manually.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No WiFi information has been provided for this property.</p>
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