'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

// Tipi per le categorie e gli elementi
interface RoomCategory {
  id: string
  property_id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
}

interface HowThingsWorkItem {
  id: string
  category_id: string
  title: string
  description?: string
  image_path: string
  display_order: number
  created_at: string
  updated_at: string
}

interface ItemPhoto {
  id: string
  item_id: string
  photo_path: string
  description?: string
  display_order: number
  created_at: string
  updated_at: string
}

export default function HowThingsWorkGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [howThingsWorkItems, setHowThingsWorkItems] = useState<{ [key: string]: HowThingsWorkItem[] }>({})
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: ItemPhoto[] }>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) return

    const fetchHowThingsWork = async () => {
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
        
        // Fetch room categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('room_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (categoriesError) throw categoriesError
        
        setRoomCategories(categoriesData || [])
        
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id)
          
          // Initialize items map for all categories
          const itemsMap: { [key: string]: HowThingsWorkItem[] } = {}
          const photosMap: { [key: string]: ItemPhoto[] } = {}
          
          // Fetch items for each category
          for (const category of categoriesData) {
            const { data: itemsData, error: itemsError } = await supabase
              .from('how_things_work_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            
            itemsMap[category.id] = itemsData || []
            
            // Fetch photos for each item
            if (itemsData && itemsData.length > 0) {
              for (const item of itemsData) {
                const { data: photosData, error: photosError } = await supabase
                  .from('how_things_work_item_photos')
                  .select('*')
                  .eq('item_id', item.id)
                  .order('display_order', { ascending: true })
                
                if (photosError) throw photosError
                
                photosMap[item.id] = photosData || []
              }
            }
          }
          
          setHowThingsWorkItems(itemsMap)
          setItemPhotos(photosMap)
          
          // Set the first item as active
          if (categoriesData[0].id in itemsMap && itemsMap[categoriesData[0].id].length > 0) {
            setActiveItem(itemsMap[categoriesData[0].id][0].id)
          }
        }
        
      } catch (error) {
        console.error('Error fetching how things work data:', error)
        setError('Could not load information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchHowThingsWork()
  }, [propertyId])

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    
    // Reset active item when changing category
    if (categoryId in howThingsWorkItems && howThingsWorkItems[categoryId].length > 0) {
      setActiveItem(howThingsWorkItems[categoryId][0].id)
    } else {
      setActiveItem(null)
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
            <h1 className="text-xl font-bold text-gray-800">How Things Work</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Information Not Available</h2>
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
          <div className="max-w-4xl mx-auto">
            {/* Property name */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                How Things Work at {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Find instructions for appliances and equipment in the property
              </p>
            </div>

            {roomCategories.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Information Available</h3>
                <p className="text-gray-600">
                  No information has been added about how things work in this property.
                </p>
              </div>
            ) : (
              <div>
                {/* Category tabs */}
                <div className="mb-6 overflow-x-auto scrollbar-hide">
                  <div className="flex space-x-2 min-w-max pb-2">
                    {roomCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          activeCategory === category.id
                            ? 'bg-[#5E2BFF] text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items for active category */}
                {activeCategory && howThingsWorkItems[activeCategory]?.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Items list sidebar */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden p-4 h-fit">
                      <h3 className="font-bold text-gray-800 mb-4">
                        {roomCategories.find(c => c.id === activeCategory)?.name}
                      </h3>
                      <div className="space-y-2">
                        {howThingsWorkItems[activeCategory].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveItem(item.id)}
                            className={`w-full text-left p-3 rounded-lg transition ${
                              activeItem === item.id
                                ? 'bg-purple-100 text-[#5E2BFF]'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 mr-2 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image_path && (
                                  <img
                                    src={item.image_path}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="font-medium truncate">{item.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item detail */}
                    {activeItem && (
                      <div className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
                        {(() => {
                          const item = howThingsWorkItems[activeCategory].find(i => i.id === activeItem)
                          const photos = itemPhotos[activeItem] || []
                          
                          if (!item) return null
                          
                          return (
                            <div>
                              {/* Main image */}
                              {item.image_path && (
                                <div className="relative h-56 w-full bg-gray-200">
                                  <img
                                    src={item.image_path}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              
                              <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                  {item.title}
                                </h2>
                                
                                {item.description && (
                                  <div className="mt-4 text-gray-700 whitespace-pre-wrap">
                                    {item.description}
                                  </div>
                                )}
                                
                                {/* Additional photos */}
                                {photos.length > 0 && (
                                  <div className="mt-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Additional Photos</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {photos.map((photo) => (
                                        <div key={photo.id} className="rounded-lg overflow-hidden">
                                          <img
                                            src={photo.photo_path}
                                            alt={photo.description || item.title}
                                            className="w-full h-40 object-cover"
                                          />
                                          {photo.description && (
                                            <div className="p-2 bg-gray-50">
                                              <p className="text-sm text-gray-700">{photo.description}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                ) : activeCategory ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-gray-600">No items available for this category.</p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="text-center mt-8">
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