'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface HowThingsWorkItem {
  id: string
  title: string
  description: string | null
  image_path: string
  display_order: number
  photos?: {
    id: string
    photo_path: string
    description: string | null
  }[]
}

interface RoomCategory {
  id: string
  name: string
  items: HowThingsWorkItem[]
}

interface RoomCategoryRecord {
  id: string
  name: string
  property_id: string
  display_order: number
  created_at: string
  updated_at: string
}

interface HowThingsWorkItemRecord {
  id: string
  category_id: string
  title: string
  description: string | null
  image_path: string
  display_order: number
  created_at: string
  updated_at: string
}

export default function HowThingsWorkPage() {
  const params = useParams()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<RoomCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchHowThingsWorkData = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch room categories for this property
        const { data: roomCategories, error: roomCategoriesError } = await supabase
          .from('room_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (roomCategoriesError) throw roomCategoriesError

        if (!roomCategories || roomCategories.length === 0) {
          setCategories([])
          setLoading(false)
          return
        }

        // Set first category as selected by default
        setSelectedCategory(roomCategories[0].id)
        
        // 2. For each category, fetch corresponding items
        const categoriesWithItems = await Promise.all(
          roomCategories.map(async (category: RoomCategoryRecord) => {
            const { data: items, error: itemsError } = await supabase
              .from('how_things_work_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError

            // 3. For each item, fetch its photos
            const itemsWithPhotos = await Promise.all(
              (items || []).map(async (item: HowThingsWorkItemRecord) => {
                const { data: photos, error: photosError } = await supabase
                  .from('how_things_work_item_photos')
                  .select('*')
                  .eq('item_id', item.id)
                  .order('display_order', { ascending: true })
                
                if (photosError) throw photosError
                
                return {
                  ...item,
                  photos: photos || []
                }
              })
            )
            
            return {
              id: category.id,
              name: category.name,
              items: itemsWithPhotos
            }
          })
        )
        
        setCategories(categoriesWithItems)
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching how things work data:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchHowThingsWorkData()
    }
  }, [propertyId])

  const getImageUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${path}`
  }

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm py-3">
        <div className="px-4 flex items-center justify-between">
          <Link href={`/guest/${propertyId}`} className="flex items-center text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-bold text-center text-[#5E2BFF]">How Things Work</h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-grow w-full p-4 pb-16">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-700 mb-2">No information available</h2>
            <p className="text-gray-500">The host hasn't added any guide on how things work yet.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {/* Categories tabs */}
            <div className="flex overflow-x-auto pb-2 -mx-1 hide-scrollbar">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 whitespace-nowrap px-4 py-2 mx-1 rounded-full text-sm font-medium ${
                    selectedCategory === category.id
                      ? 'bg-[#5E2BFF] text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Items in selected category */}
            {selectedCategoryData && selectedCategoryData.items.length > 0 ? (
              <div className="space-y-4">
                {selectedCategoryData.items.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="relative h-48 w-full">
                      <Image
                        src={getImageUrl(item.image_path)}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-600 mb-3">{item.description}</p>
                      )}
                      
                      {/* Additional photos if available */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-700 mb-2">Additional photos:</h4>
                          <div className="flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4 hide-scrollbar">
                            {item.photos.map(photo => (
                              <div key={photo.id} className="flex-shrink-0 w-32 h-32 relative rounded-lg overflow-hidden">
                                <Image
                                  src={getImageUrl(photo.photo_path)}
                                  alt={photo.description || item.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedCategoryData ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No items in this category.</p>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
} 