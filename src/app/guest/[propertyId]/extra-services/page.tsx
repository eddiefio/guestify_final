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
}

export default function ExtraServicesGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<ExtraService[]>([])
  const [propertyName, setPropertyName] = useState('')
  const [servicePhotos, setServicePhotos] = useState<Record<string, ServicePhoto[]>>({})
  const [cart, setCart] = useState<{serviceId: string, quantity: number}[]>([])

  useEffect(() => {
    if (!propertyId) return

    const fetchExtraServices = async () => {
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
    
    fetchExtraServices()
  }, [propertyId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const addToCart = (serviceId: string) => {
    const existingItem = cart.find(item => item.serviceId === serviceId)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.serviceId === serviceId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ))
    } else {
      setCart([...cart, { serviceId, quantity: 1 }])
    }
    
    toast('Added to cart', {
      icon: '🛒',
      position: 'bottom-center',
      duration: 2000,
    })
  }

  const toast = (message: string, options: { icon: string, position: 'bottom-center', duration: number }) => {
    const toastElement = document.createElement('div')
    toastElement.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50'
    toastElement.innerHTML = `${options.icon} <span class="ml-2">${message}</span>`
    document.body.appendChild(toastElement)
    
    setTimeout(() => {
      toastElement.remove()
    }, options.duration)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            </div>
            
            {cart.length > 0 && (
              <Link href={`/guest/${propertyId}/extra-services/cart`}>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </Link>
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
            {/* Property name */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Extra Services at {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Enhance your stay with our premium services
              </p>
            </div>

            {services.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Extra Services Available</h3>
                <p className="text-gray-600">
                  There are no extra services available for this property at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {servicePhotos[service.id]?.length > 0 && (
                      <div className="relative h-48 w-full bg-gray-200">
                        <img
                          src={servicePhotos[service.id][0].photo_path}
                          alt={service.title}
                          className="w-full h-full object-cover"
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
                        className="mt-4 w-full py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-opacity-90 transition duration-200 font-bold flex items-center justify-center"
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