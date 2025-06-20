'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, X, Plus, Minus, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '@/contexts/CartContext'

interface ExtraService {
  id: string
  title: string
  description: string | null
  price: number
  active: boolean
  property_id: string
  created_at: string
  category?: string
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
  
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartItem, 
    getCartTotal, 
    getCartItemCount,
    setPropertyId 
  } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<ExtraService[]>([])
  const [propertyName, setPropertyName] = useState('')
  const [servicePhotos, setServicePhotos] = useState<Record<string, ServicePhoto[]>>({})
  const [showCart, setShowCart] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<string>('all')

  // Categories for filtering services
  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'checkin-checkout', name: 'Check-in & Check-out' },
    { id: 'comfort', name: 'Comfort & Amenities' },
    { id: 'transport', name: 'Transportation' },
    { id: 'food', name: 'Food & Drinks' }
  ]

  // Set property ID when component mounts
  useEffect(() => {
    if (propertyId) {
      setPropertyId(propertyId)
    }
  }, [propertyId, setPropertyId])

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
        
        // Fetch active extra services
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

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }
  
  // Categorize services (simplified version - in a real app you'd have a category field in the DB)
  const getCategoryForService = (service: ExtraService): string => {
    // Se il servizio ha una categoria definita, usala
    if (service.category) {
      return service.category;
    }
    
    // Fallback alla logica esistente basata sul titolo se la categoria non è definita
    const title = service.title.toLowerCase()
    
    if (title.includes('check-in') || title.includes('check-out') || title.includes('checkout') || title.includes('checkin') || title.includes('late') || title.includes('early')) {
      return 'checkin-checkout'
    } else if (title.includes('car') || title.includes('airport') || title.includes('pickup') || title.includes('taxi') || title.includes('transfer')) {
      return 'transport'
    } else if (title.includes('food') || title.includes('breakfast') || title.includes('dinner') || title.includes('lunch') || title.includes('drink')) {
      return 'food'
    } else {
      return 'comfort'
    }
  }
  
  // Filter services by category
  const filteredServices = serviceCategory === 'all' 
    ? services 
    : services.filter(service => getCategoryForService(service) === serviceCategory)
  
  // Handle add to cart with global cart context
  const handleAddToCart = (service: ExtraService) => {
    addToCart(service)
    toast.success(`Added ${service.title} to cart`)
  }

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    router.push(`/guest/checkout`)
  }
  
  // Calculate number of items in cart
  const cartItemCount = getCartItemCount()

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
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Extra Services</h1>
            </div>
            
            <button 
              className="relative p-2 rounded-full hover:bg-gray-100 text-[#5E2BFF]"
              onClick={() => setShowCart(true)}
              aria-label="Open shopping cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ffde59] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading services...</p>
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
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Extra Services at {propertyName}
              </h2>
              <p className="text-gray-600 mt-1">
                Enhance your stay with our additional services
              </p>
            </div>
            
            {/* Category Filter */}
            <div className="mb-6 overflow-x-auto pb-2">
              <div className="flex space-x-2 min-w-max">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setServiceCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      serviceCategory === category.id
                        ? 'bg-[#5E2BFF] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Services Available</h3>
                <p className="text-gray-600">
                  {serviceCategory === 'all'
                    ? 'No extra services have been set up for this property yet.'
                    : `No services in the "${categories.find(c => c.id === serviceCategory)?.name}" category are available.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Service Photos */}
                    {servicePhotos[service.id] && servicePhotos[service.id].length > 0 ? (
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={servicePhotos[service.id][0].photo_path}
                          alt={service.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-bold text-lg">{service.title}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm opacity-90">
                              {formatPrice(service.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-b">
                        <h3 className="font-bold text-lg text-gray-800">{service.title}</h3>
                        <span className="text-sm font-bold text-[#5E2BFF]">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    )}
                    
                    <div className="p-4">
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div>
                          {cart.some(item => item.service.id === service.id) ? (
                            <span className="text-green-500 text-sm font-medium">Added to cart</span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => handleAddToCart(service)}
                          className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200 text-sm font-bold"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end transition-all">
          <div onClick={() => setShowCart(false)} className="flex-grow" />
          <div className="w-full max-w-md bg-white h-full overflow-auto shadow-xl animate-slide-in">
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                aria-label="Close cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Your Cart is Empty</h3>
                  <p className="text-gray-700 mb-6">
                    Add services to your cart to enhance your stay
                  </p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-[#5E2BFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition duration-200"
                  >
                    Browse Services
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.service.id} className="flex border-b pb-4">
                        <div className="flex-grow">
                          <h3 className="font-bold text-gray-800">{item.service.title}</h3>
                          <p className="text-gray-700 text-sm mt-1">
                            {formatPrice(item.service.price)} per item
                          </p>
                          <div className="flex items-center mt-3">
                            <button
                              onClick={() => updateCartItem(item.service.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border text-gray-700 hover:bg-gray-100"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="mx-3 w-6 text-center font-medium text-gray-800">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.service.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border text-gray-700 hover:bg-gray-100"
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-gray-800">
                            {formatPrice(item.service.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.service.id)}
                            className="text-red-600 text-sm mt-3 hover:underline font-medium"
                            aria-label="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-gray-700 mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg mb-6 text-gray-800">
                      <span>Total</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-[#ffde59] text-black py-3 rounded-lg font-bold hover:bg-[#f8c70a] transition duration-200 flex items-center justify-center"
                      aria-label="Proceed to checkout"
                    >
                      <span>Proceed to Checkout</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition duration-200"
                      aria-label="Continue shopping"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 