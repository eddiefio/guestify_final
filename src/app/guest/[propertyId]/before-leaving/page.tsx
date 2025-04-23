'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface ProvidedCategory {
  id: string
  property_id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
  items: ProvidedItem[]
}

interface ProvidedItem {
  id: string
  category_id: string
  name: string
  description: string | null
  quantity: number
  display_order: number
  created_at: string
  updated_at: string
}

interface InformationNeeded {
  id: string
  property_id: string
  content: string
  created_at: string
  updated_at: string
}

interface DirectionPhoto {
  id: string
  property_id: string
  direction_type: 'driving' | 'train'
  photo_url: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export default function BeforeLeavingPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [activeTab, setActiveTab] = useState<'whats-provided' | 'info-needed' | 'how-to-get'>('whats-provided')
  const [providedCategories, setProvidedCategories] = useState<ProvidedCategory[]>([])
  const [informationNeeded, setInformationNeeded] = useState<string>('')
  const [drivingDirections, setDrivingDirections] = useState<DirectionPhoto[]>([])
  const [trainDirections, setTrainDirections] = useState<DirectionPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [transportMethod, setTransportMethod] = useState<'car' | 'train'>('car')

  useEffect(() => {
    if (!propertyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch provided categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('provided_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
          
        if (categoriesError) throw categoriesError
        
        // Fetch items for each category
        const categoriesWithItems = await Promise.all(
          (categoriesData || []).map(async (category: any) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('provided_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            
            return {
              ...category,
              items: itemsData || []
            }
          })
        )
        
        setProvidedCategories(categoriesWithItems)
        
        // Fetch information needed
        const { data: infoData, error: infoError } = await supabase
          .from('information_needed')
          .select('*')
          .eq('property_id', propertyId)
          .single()
          
        if (!infoError && infoData) {
          setInformationNeeded(infoData.content)
        }
        
        // Fetch directions photos
        const { data: directionsData, error: directionsError } = await supabase
          .from('directions_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
          
        if (directionsError) throw directionsError
        
        if (directionsData) {
          setDrivingDirections(directionsData.filter((d: DirectionPhoto) => d.direction_type === 'driving'))
          setTrainDirections(directionsData.filter((d: DirectionPhoto) => d.direction_type === 'train'))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
          <h1 className="text-xl font-bold text-gray-800">Before You Leave Home</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6 pb-20">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
          </div>
        ) : (
          <>
            {/* Tabs for categories */}
            <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-4 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'whats-provided' ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                onClick={() => setActiveTab('whats-provided')}
              >
                <div className="text-blue-500 mb-1 md:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-sm font-bold text-gray-800 text-center">What's Provided</h2>
              </div>

              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-4 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'info-needed' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                onClick={() => setActiveTab('info-needed')}
              >
                <div className="text-yellow-500 mb-1 md:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-sm font-bold text-gray-800 text-center">Info We Need</h2>
              </div>

              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-4 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'how-to-get' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                onClick={() => setActiveTab('how-to-get')}
              >
                <div className="text-green-500 mb-1 md:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-sm font-bold text-gray-800 text-center">How To Get There</h2>
              </div>
            </div>

            {/* Content based on selected tab */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              {activeTab === 'whats-provided' && (
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">What's Provided</h2>
                  
                  {providedCategories.length > 0 ? (
                    <div className="space-y-6">
                      {providedCategories.map(category => (
                        <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">{category.name}</h3>
                          </div>
                          
                          <div className="p-4">
                            {category.items.length > 0 ? (
                              <ul className="divide-y divide-gray-200">
                                {category.items.map(item => (
                                  <li key={item.id} className="py-3 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-800">{item.name}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                      )}
                                    </div>
                                    {item.quantity > 1 && (
                                      <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                                        x{item.quantity}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-center py-4">No items in this category</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No items information available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info-needed' && (
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Information We Need</h2>
                  
                  {informationNeeded ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      {informationNeeded.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 text-gray-800">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No information requested by the host</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'how-to-get' && (
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">How To Get There</h2>
                  
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setTransportMethod('car')}
                      className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                        transportMethod === 'car' 
                          ? 'bg-[#5E2BFF] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 10h8M7 14h1M16 14h1M6 7h12a1 1 0 0 1 1 1v7.59a1 1 0 0 1-.3.7L17 18H7l-1.7-1.71a1 1 0 0 1-.3-.7V8a1 1 0 0 1 1-1z"/>
                        <path d="M5 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
                      </svg>
                      <span className="font-medium">By Car</span>
                    </button>
                    <button 
                      onClick={() => setTransportMethod('train')}
                      className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                        transportMethod === 'train' 
                          ? 'bg-[#5E2BFF] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M4 15.5h16M4 8.5h16M18 15.5v4.5M6 15.5v4.5M12 15.5v4.5M8.5 4v4.5M15.5 4v4.5" />
                        <rect x="6" y="4" width="12" height="11.5" rx="1" />
                      </svg>
                      <span className="font-medium">By Train</span>
                    </button>
                  </div>
                  
                  {transportMethod === 'car' && (
                    <div className="space-y-4">
                      {drivingDirections.length > 0 ? (
                        drivingDirections.map((photo, index) => (
                          <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative w-full h-48">
                              <img 
                                src={photo.photo_url} 
                                alt={`Driving direction ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {photo.description && (
                              <div className="p-3 bg-gray-50">
                                <p className="text-sm text-gray-700">{photo.description}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No driving directions available</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {transportMethod === 'train' && (
                    <div className="space-y-4">
                      {trainDirections.length > 0 ? (
                        trainDirections.map((photo, index) => (
                          <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative w-full h-48">
                              <img 
                                src={photo.photo_url} 
                                alt={`Train direction ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {photo.description && (
                              <div className="p-3 bg-gray-50">
                                <p className="text-sm text-gray-700">{photo.description}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No train directions available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
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