'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface ExtraService {
  id: string
  title: string
  description: string | null
  price: number
  active: boolean
  property_id: string
  created_at: string
}

interface ServicePhoto {
  id: string
  photo_path: string
  description?: string
  display_order: number
  service_id: string
}

export default function ExtraServicesGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<ExtraService[]>([])
  const [servicePhotos, setServicePhotos] = useState<Record<string, ServicePhoto[]>>({})
  const [propertyName, setPropertyName] = useState('')
  const [cartItems, setCartItems] = useState<{serviceId: string, quantity: number}[]>([])
  
  useEffect(() => {
    if (!propertyId) return

    const fetchServices = async () => {
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
        
        // Fetch extra services
        const { data, error } = await supabase
          .from('extra_services')
          .select('*')
          .eq('property_id', propertyId)
          .eq('active', true)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setServices(data || [])
        
        // Fetch photos for each service
        if (data && data.length > 0) {
          const photoPromises = data.map(async (service: ExtraService) => {
            const { data: photos, error: photosError } = await supabase
              .from('extra_service_photos')
              .select('*')
              .eq('service_id', service.id)
              .order('display_order', { ascending: true })
              
            if (photosError) {
              console.error('Error fetching photos for service:', service.id, photosError)
              return { serviceId: service.id, photos: [] }
            }
            
            return { serviceId: service.id, photos: photos || [] }
          })
          
          const photosResults = await Promise.all(photoPromises)
          const photosMap: Record<string, ServicePhoto[]> = {}
          
          photosResults.forEach(result => {
            photosMap[result.serviceId] = result.photos
          })
          
          setServicePhotos(photosMap)
        }
        
      } catch (error) {
        console.error('Error fetching extra services:', error)
        setError('Could not load extra services')
      } finally {
        setLoading(false)
      }
    }
    
    fetchServices()
  }, [propertyId])
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    })
  }
  
  const addToCart = (serviceId: string) => {
    // Check if item is already in cart
    const existingItem = cartItems.find(item => item.serviceId === serviceId)
    
    if (existingItem) {
      // Update quantity if already in cart
      setCartItems(cartItems.map(item => 
        item.serviceId === serviceId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ))
    } else {
      // Add new item to cart
      setCartItems([...cartItems, { serviceId, quantity: 1 }])
    }
    
    toast('Added to cart')
  }
  
  const toast = (message: string) => {
    // Simple toast notification
    const toastElement = document.createElement('div')
    toastElement.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm'
    toastElement.innerText = message
    document.body.appendChild(toastElement)
    
    setTimeout(() => {
      toastElement.classList.add('opacity-0')
      toastElement.classList.add('transition-opacity')
      toastElement.classList.add('duration-300')
      
      setTimeout(() => {
        document.body.removeChild(toastElement)
      }, 300)
    }, 2000)
  }
  
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const service = services.find(s => s.id === item.serviceId)
      return total + (service ? service.price * item.quantity : 0)
    }, 0)
  }
  
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan pb-20">
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
            <h1 className="text-xl font-bold text-gray-800">Extra Services</h1>
            
            {/* Cart icon */}
            {cartItems.length > 0 && (
              <div className="ml-auto relative">
                <button 
                  className="p-2 rounded-full bg-[#5E2BFF] text-white relative"
                  onClick={() => router.push(`/guest/${propertyId}/cart`)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {getCartCount()}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading extra services...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Services Not Available</h2>
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
            {/* Property name and intro */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Extra Services at {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Enhance your stay with these additional services
              </p>
            </div>

            {services.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Extra Services</h3>
                <p className="text-gray-600">
                  No extra services are currently available for this property.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {servicePhotos[service.id] && servicePhotos[service.id].length > 0 && (
                      <div className="relative h-48 w-full">
                        <img
                          src={servicePhotos[service.id][0].photo_path}
                          alt={service.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {service.title}
                          </h3>
                          {service.description && (
                            <p className="text-gray-700 mb-4">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="text-xl font-bold text-[#5E2BFF]">
                          {formatPrice(service.price)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addToCart(service.id)}
                        className="mt-4 w-full bg-[#5E2BFF] text-white py-2 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fixed checkout button if items in cart */}
            {cartItems.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={() => router.push(`/guest/${propertyId}/cart`)}
                    className="w-full bg-[#5E2BFF] text-white py-3 rounded-lg font-bold flex items-center justify-center"
                  >
                    <span className="mr-2">Proceed to Checkout</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </button>
                </div>
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