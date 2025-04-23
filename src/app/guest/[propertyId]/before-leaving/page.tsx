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
                        <p key={i} className="mb-2">{line}</p>
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
                  
                  <div className="space-y-6">
                    {/* Driving directions */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="font-bold text-gray-800">By Car</h3>
                      </div>
                      
                      {drivingDirections.length > 0 ? (
                        <div className="p-4 space-y-4">
                          {drivingDirections.map((photo, index) => (
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
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No driving directions available</p>
                      )}
                    </div>
                    
                    {/* Train directions */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <h3 className="font-bold text-gray-800">By Train</h3>
                      </div>
                      
                      {trainDirections.length > 0 ? (
                        <div className="p-4 space-y-4">
                          {trainDirections.map((photo, index) => (
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
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No train directions available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout checklist section */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Checkout Checklist</h2>
              <p className="text-sm text-gray-600 mb-4">Please check each item before you leave the property.</p>
              
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

            {allChecked && (
              <div className="bg-green-100 border border-green-200 rounded-xl p-4 text-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-bold text-green-800">All Set!</h2>
                <p className="text-sm text-green-700">You've completed all the checks. Have a safe journey!</p>
              </div>
            )}
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