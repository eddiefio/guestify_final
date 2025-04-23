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
}

interface HowThingsWorkItem {
  id: string
  category_id: string
  title: string
  description?: string
  image_path: string
  display_order: number
}

interface ItemPhoto {
  id: string
  item_id: string
  photo_path: string
  description?: string
  display_order: number
}

// Funzione per formattare gli URL delle immagini
const getImageUrl = (imagePath: string, isItemPhoto: boolean = false) => {
  if (!imagePath) return '';
  
  // Se l'URL è già un URL completo (inizia con http/https), usalo così com'è
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Utilizza il bucket appropriato in base al tipo di immagine
  const bucketName = isItemPhoto ? 'item-photos' : 'how-things-work-images';
  
  // Genera l'URL pubblico per Supabase Storage usando il bucket corretto
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(imagePath);
    
  return data?.publicUrl || '';
};

// Componente per l'immagine zoomabile
const ZoomableImage = ({ src, alt, isItemPhoto = false }: { src: string; alt: string; isItemPhoto?: boolean }) => {
  const [zoomed, setZoomed] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    setImageUrl(getImageUrl(src, isItemPhoto));
  }, [src, isItemPhoto]);

  const toggleZoom = () => {
    setZoomed(!zoomed);
  };

  if (!src) {
    return (
      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Image not available</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative ${zoomed ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full h-48'}`}
        onClick={toggleZoom}
      >
        <Image 
          src={imageUrl}
          alt={alt}
          fill
          className={`${zoomed ? 'object-contain' : 'object-cover'}`}
          unoptimized
        />
        {zoomed && (
          <button 
            className="absolute top-4 right-4 bg-white text-black p-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default function HowThingsWorkPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<RoomCategory[]>([])
  const [items, setItems] = useState<{ [key: string]: HowThingsWorkItem[] }>({})
  const [photos, setPhotos] = useState<{ [key: string]: ItemPhoto[] }>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<HowThingsWorkItem | null>(null)
  const [itemPhotos, setItemPhotos] = useState<ItemPhoto[]>([])

  // Carica tutte le categorie e gli elementi
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Carica le categorie delle stanze
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('room_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (categoriesError) throw categoriesError
        
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData)
          setActiveCategory(categoriesData[0].id)
          
          // Inizializza lo state degli elementi per tutte le categorie
          const itemsMap: { [key: string]: HowThingsWorkItem[] } = {}
          const photosMap: { [key: string]: ItemPhoto[] } = {}
          
          // Carica gli elementi per ogni categoria
          for (const category of categoriesData) {
            const { data: itemsData, error: itemsError } = await supabase
              .from('how_things_work_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            itemsMap[category.id] = itemsData || []
            
            // Carica le foto per ogni elemento
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
        } else {
          setError('No categories found for this property')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId])

  const handleSelectItem = (item: HowThingsWorkItem) => {
    setSelectedItem(item)
    setItemPhotos(photos[item.id] || [])
  }

  const handleBackToItems = () => {
    setSelectedItem(null)
    setItemPhotos([])
  }

  // Piccolo componente per generare il fallback dell'immagine
  const ImageFallback = ({ className }: { className?: string }) => (
    <div className={`bg-gray-100 flex items-center justify-center ${className || "w-16 h-16"}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col pb-14">
      <header className="bg-white shadow-sm py-3 sticky top-0 z-10">
        <div className="w-full px-4 flex items-center">
          <button 
            onClick={() => selectedItem ? handleBackToItems() : router.back()} 
            className="mr-4 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {selectedItem ? selectedItem.title : 'How Things Work'}
          </h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : selectedItem ? (
          // Visualizzazione dettaglio dell'elemento selezionato
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {selectedItem.image_path ? (
              <ZoomableImage src={selectedItem.image_path} alt={selectedItem.title} isItemPhoto={false} />
            ) : (
              <ImageFallback className="w-full h-48" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
              )}
              
              {/* Istruzioni e foto aggiuntive */}
              {itemPhotos.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
                  <div className="space-y-6">
                    {itemPhotos.map((photo, index) => (
                      <div key={photo.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-[#5E2BFF] text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">Step {index + 1}</span>
                        </div>
                        <ZoomableImage src={photo.photo_path} alt={`Step ${index + 1}`} isItemPhoto />
                        {photo.description && (
                          <p className="text-gray-600 mt-3 text-sm">{photo.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Selezione categoria */}
            {categories.length > 0 && (
              <div className="mb-4 flex overflow-x-auto pb-2 -mx-4 px-4">
                <div className="flex space-x-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`py-1.5 px-3 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeCategory === category.id
                          ? 'bg-[#5E2BFF] text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista elementi della categoria selezionata */}
            <div className="space-y-4">
              {activeCategory && items[activeCategory]?.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center active:bg-gray-50"
                  onClick={() => handleSelectItem(item)}
                >
                  {item.image_path ? (
                    <div className="flex-shrink-0 relative w-16 h-16 rounded-md overflow-hidden mr-3">
                      <Image 
                        src={getImageUrl(item.image_path, false)}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <ImageFallback />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    {photos[item.id] && photos[item.id].length > 0 && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-[#5E2BFF]">
                          {photos[item.id].length} instructions available
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-[#5E2BFF]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
              
              {activeCategory && (!items[activeCategory] || items[activeCategory].length === 0) && (
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-gray-500 text-center">No items found in this category.</p>
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