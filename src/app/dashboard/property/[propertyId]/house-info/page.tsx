'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Tipi per le diverse sezioni
interface HouseRule {
  id: string
  title: string
  description?: string
  active: boolean
}

interface WifiCredential {
  id: string
  network_name: string
  password: string
}

interface HowThingsWorkItem {
  id: string
  title: string
  description?: string
  file_path: string
}

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

export default function HouseInfo() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [houseRules, setHouseRules] = useState<HouseRule[]>([])
  const [wifiCredentials, setWifiCredentials] = useState<WifiCredential | null>(null)
  const [howThingsWork, setHowThingsWork] = useState<HowThingsWorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('house-rules')
  const { user } = useAuth()
  const router = useRouter()

  // Carica i dati della proprietà e tutte le informazioni correlate
  useEffect(() => {
    if (!user || !propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)
        
        // Carica i dati della proprietà
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('host_id', user.id)
          .single()
        
        if (propertyError) throw propertyError
        if (!propertyData) {
          toast.error('Property not found or access denied')
          router.push('/dashboard')
          return
        }
        
        setProperty(propertyData)
        
        // Carica le regole della casa
        const { data: rulesData, error: rulesError } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (rulesError) throw rulesError
        setHouseRules(rulesData || [])
        
        // Carica le credenziali WiFi
        const { data: wifiData, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        // È normale che non ci siano credenziali WiFi, quindi non lanciamo errori
        setWifiCredentials(wifiData || null)
        
        // Carica le istruzioni "How Things Work"
        const { data: howThingsData, error: howThingsError } = await supabase
          .from('how_things_work')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (howThingsError) throw howThingsError
        setHowThingsWork(howThingsData || [])
        
      } catch (error) {
        console.error('Error fetching property data:', error)
        toast.error('Failed to load property information')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId, user, router])

  // Funzione per cambiare tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <ProtectedRoute>
      <Layout title={`House Info - ${property?.name || 'Property'}`}>
        <div className="container mx-auto px-4 py-6 font-spartan">
          {/* Header con breadcrumb e nome proprietà */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Link href="/dashboard">
                <span className="hover:text-[#5E2BFF] transition">Dashboard</span>
              </Link>
              <svg className="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="font-medium">House Info</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              House Info for {property?.name || 'Loading...'}
            </h1>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading house information...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Tab navigation */}
              <div className="flex border-b">
                <button
                  onClick={() => handleTabChange('house-rules')}
                  className={`px-6 py-3 text-base font-bold ${
                    activeTab === 'house-rules'
                      ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  House Rules
                </button>
                <button
                  onClick={() => handleTabChange('wifi-connection')}
                  className={`px-6 py-3 text-base font-bold ${
                    activeTab === 'wifi-connection'
                      ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  WiFi Connection
                </button>
                <button
                  onClick={() => handleTabChange('how-things-work')}
                  className={`px-6 py-3 text-base font-bold ${
                    activeTab === 'how-things-work'
                      ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  How Things Work
                </button>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {/* House Rules Tab */}
                {activeTab === 'house-rules' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">House Rules</h2>
                      <Link href={`/dashboard/property/${propertyId}/house-rules`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg> Manage Rules
                        </button>
                      </Link>
                    </div>

                    {houseRules.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No house rules have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/house-rules`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Add House Rules
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {houseRules.map((rule) => (
                          <div key={rule.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                            <h3 className="font-bold text-lg text-gray-800">{rule.title}</h3>
                            {rule.description && (
                              <p className="text-gray-600 mt-2">{rule.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* WiFi Connection Tab */}
                {activeTab === 'wifi-connection' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">WiFi Connection</h2>
                      <Link href={`/dashboard/property/${propertyId}/wifi-connection`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          {wifiCredentials ? 'Edit WiFi' : 'Set Up WiFi'}
                        </button>
                      </Link>
                    </div>

                    {!wifiCredentials ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No WiFi credentials have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/wifi-connection`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Set Up WiFi
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-6">
                        <div className="mb-4">
                          <h3 className="text-sm text-gray-500 font-medium">Network Name</h3>
                          <p className="text-lg font-bold">{wifiCredentials.network_name}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm text-gray-500 font-medium">Password</h3>
                          <p className="text-lg font-bold">{wifiCredentials.password}</p>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Guests will be able to connect to your WiFi by scanning the QR code.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* How Things Work Tab */}
                {activeTab === 'how-things-work' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">How Things Work</h2>
                      <Link href={`/dashboard/property/${propertyId}/how-things-work`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg> Manage Guides
                        </button>
                      </Link>
                    </div>

                    {howThingsWork.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No guides have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/how-things-work`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Add Guides
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {howThingsWork.map((item) => (
                          <div key={item.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                            <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                            {item.description && (
                              <p className="text-gray-600 mt-2">{item.description}</p>
                            )}
                            <div className="mt-3">
                              <a 
                                href={item.file_path} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#5E2BFF] font-bold hover:underline flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                View Guide
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 