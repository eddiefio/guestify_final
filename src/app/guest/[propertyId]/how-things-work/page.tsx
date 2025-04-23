'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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

export default function HowThingsWorkPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [categories, setCategories] = useState<RoomCategory[]>([])
  const [items, setItems] = useState<{[key: string]: HowThingsWorkItem[]}>({})
  const [photos, setPhotos] = useState<{[key: string]: ItemPhoto[]}>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) return

    const fetchData = async () => {
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
        
        setCategories(categoriesData || [])
        
        if (categoriesData && categoriesData.length > 0) {
          // Set first category as active
          setActiveCategory(categoriesData[0].id)
          
          // Fetch items for each category
          const itemsMap: {[key: string]: HowThingsWorkItem[]} = {}
          const photosMap: {[key: string]: ItemPhoto[]} = {}
          
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
          
          setItems(itemsMap)
          setPhotos(photosMap)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Could not load appliance information')
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
            onClick={() => router.push(`/guest/${propertyId}`)} 
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading appliance information...</p>
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
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-700 mb-2">No Instructions Available</h3>
              <p className="text-gray-600">
                No appliance instructions have been added to this property yet.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Category tabs */}
            <div className="flex overflow-x-auto scrollbar-hide space-x-2 mb-4 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium ${
                    activeCategory === category.id
                      ? 'bg-[#5E2BFF] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Items for active category */}
            {activeCategory && items[activeCategory] && (
              <div className="space-y-4">
                {items[activeCategory].length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <p className="text-gray-600">No items in this category</p>
                  </div>
                ) : (
                  items[activeCategory].map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 mb-3">
                        {item.title}
                      </h2>
                      
                      {/* Item image */}
                      {item.image_path && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={item.image_path} 
                            alt={item.title} 
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Item description */}
                      {item.description && (
                        <div className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                          {item.description}
                        </div>
                      )}
                      
                      {/* Additional photos */}
                      {photos[item.id] && photos[item.id].length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium text-gray-800 mb-2">Additional Photos</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {photos[item.id].map((photo) => (
                              <div key={photo.id} className="rounded-lg overflow-hidden">
                                <img
                                  src={photo.photo_path}
                                  alt={photo.description || item.title}
                                  className="w-full h-32 object-cover"
                                />
                                {photo.description && (
                                  <div className="p-2 bg-gray-100">
                                    <p className="text-xs text-gray-700">{photo.description}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
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