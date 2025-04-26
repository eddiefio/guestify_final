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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

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

  // Funzione per copiare negli appunti
  const copyToClipboard = (text: string, type: 'network' | 'password') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyFeedback(type === 'network' ? 'Nome rete copiato!' : 'Password copiata!')
        setTimeout(() => setCopyFeedback(null), 2000)
      })
      .catch(err => {
        console.error('Errore durante la copia: ', err)
      })
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
                        <div className="flex items-center justify-between">
                          <div className="text-gray-800 font-bold text-lg">{wifiCredentials.network_name}</div>
                          <button
                            onClick={() => copyToClipboard(wifiCredentials.network_name, 'network')}
                            className="ml-2 p-2 text-[#5E2BFF] hover:bg-gray-100 rounded-full"
                            aria-label="Copia nome rete"
                            title="Copia nome rete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm">Password:</div>
                        <div className="flex items-center justify-between">
                          <div className="text-gray-800 font-bold text-lg">{wifiCredentials.password}</div>
                          <button
                            onClick={() => copyToClipboard(wifiCredentials.password, 'password')}
                            className="ml-2 p-2 text-[#5E2BFF] hover:bg-gray-100 rounded-full"
                            aria-label="Copia password"
                            title="Copia password"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {copyFeedback && (
                        <div className="mt-2 text-center">
                          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {copyFeedback}
                          </div>
                        </div>
                      )}
                    </div>

                    {qrCodeUrl && (
                      <div className="flex justify-center mb-6">
                        <div className="bg-white p-2 border border-gray-200 rounded-lg">
                          <img src={qrCodeUrl} alt="WiFi QR Code" className="w-64 h-64" />
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-gray-600 text-sm">
                        Scan the QR code with your device's camera to connect automatically, or use the credentials above to connect manually.
                      </p>
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