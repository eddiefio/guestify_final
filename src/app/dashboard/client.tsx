'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
  has_wifi?: boolean
  has_how_things_work?: boolean
}

export default function DashboardClient() {
  const { user, isLoading } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  // Load user properties
  useEffect(() => {
    if (!user) return

    const fetchProperties = async () => {
      try {
        setLoading(true)
        
        // Fetch properties
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Fetch additional data for properties
        if (data && data.length > 0) {
          const propertiesWithData = await Promise.all(
            data.map(async (property: {
              id: string;
              name: string;
              address: string;
              city?: string;
              country?: string;
            }) => {
              // Check if property has wifi credentials
              const { count: wifiCount, error: wifiError } = await supabase
                .from('wifi_credentials')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', property.id)
              
              // Check if property has how things work guides
              const { count: howThingsCount, error: howThingsError } = await supabase
                .from('how_things_work')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', property.id)
              
              return {
                ...property,
                has_wifi: wifiCount ? wifiCount > 0 : false,
                has_how_things_work: howThingsCount ? howThingsCount > 0 : false
              }
            })
          )
          
          setProperties(propertiesWithData)
        } else {
          setProperties([])
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
        toast.error('Error loading properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [user])

  // Filter properties based on search term
  const filteredProperties = properties.filter(prop => 
    prop.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <Layout title="Dashboard - Guestify">
        <div className="container mx-auto px-4 pt-1 pb-6 font-spartan">
          <div className="flex flex-col md:flex-row justify-between mb-8 items-center">
            <div className="flex justify-between items-center w-full mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-[#5E2BFF]">Dashboard</h1>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                {new Date().toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              <div className="relative w-full md:w-60">
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              <Link href="/dashboard/add-property">
                <button className="bg-[#ffde59] text-black px-4 py-2.5 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm w-full sm:w-auto">
                  <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Property
                </button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="text-6xl text-[#5E2BFF] mb-6 opacity-80">
                <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">No properties found</h2>
              <p className="text-gray-600 mb-8 font-medium">
                You haven't added any properties yet. Start by adding your first property!
              </p>
              <Link href="/dashboard/add-property">
                <button className="bg-[#ffde59] text-black px-6 py-3 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm">
                  <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add First Property
                </button>
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">All Properties ({filteredProperties.length})</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-200 border border-gray-100">
                    {/* Card header */}
                    <div className="bg-gradient-to-r from-[#5E2BFF] to-[#7e58ff] p-5 text-white">
                      <h2 className="text-xl font-bold">{property.name}</h2>
                      <p className="text-white text-opacity-90 text-sm mt-1 font-medium">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {property.city && property.country ? `${property.city}, ${property.country}` : property.address}
                      </p>
                    </div>
                    
                    {/* Card body */}
                    <div className="p-5">
                      <p className="text-gray-600 mb-4 font-medium">{property.address}</p>
                      
                      {/* Property feature buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                        <Link href={`/dashboard/property/${property.id}/house-rules`}>
                          <div className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition h-full">
                            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">House Rules</span>
                          </div>
                        </Link>
                        
                        <Link href={`/dashboard/property/${property.id}/qr-code`}>
                          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition h-full">
                            <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">QR Code</span>
                          </div>
                        </Link>
                        
                        <Link href={`/dashboard/property/${property.id}/wifi-connection`}>
                          <div className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition h-full relative">
                            <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">Wifi Connection</span>
                            {property.has_wifi && (
                              <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </div>
                        </Link>

                        <Link href={`/dashboard/property/${property.id}/how-things-work`}>
                          <div className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition h-full relative">
                            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">How Things Work</span>
                            {property.has_how_things_work && (
                              <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </div>
                        </Link>
                        
                        <Link href={`/dashboard/property/${property.id}/extra-services`}>
                          <div className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition h-full">
                            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">Extra Services</span>
                          </div>
                        </Link>
                        
                        <Link href={`/dashboard/property/${property.id}/city-guide`}>
                          <div className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition h-full">
                            <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                              </svg>
                            </div>
                            <span className="ml-3 font-bold text-base">Host Guides</span>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Management actions */}
                      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                        <Link href={`/dashboard/edit-property/${property.id}`}>
                          <button className="text-[#5E2BFF] hover:underline font-bold">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg> Edit
                          </button>
                        </Link>
                        <Link href={`/dashboard/delete-property/${property.id}`}>
                          <button className="text-red-500 hover:underline font-bold">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg> Delete
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}