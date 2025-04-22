'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import Image from 'next/image'

type ExtraService = {
  id: string
  title: string
  description: string | null
  price: number
  active: boolean
  property_id: string
  created_at: string
}

type SuggestedService = {
  id: string
  title: string
  description: string
  price: number
}

type ServicePhoto = {
  id: string
  photo_path: string
  description?: string
  display_order: number
}

export default function ExtraServices() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<ExtraService[]>([])
  const [propertyName, setPropertyName] = useState('')
  const [servicePhotos, setServicePhotos] = useState<Record<string, ServicePhoto[]>>({})
  
  // Servizi suggeriti comuni
  const suggestedServices: SuggestedService[] = [
    {
      id: 'suggested-1',
      title: 'Late check-out',
      description: 'Extend your stay and check out later than the standard time (up to 2 PM).',
      price: 30
    },
    {
      id: 'suggested-2',
      title: 'Early check-in',
      description: 'Arrive earlier than the standard check-in time (from 10 AM).',
      price: 30
    },
    {
      id: 'suggested-3',
      title: 'Extra cleaning during stay',
      description: 'Additional cleaning service during your stay.',
      price: 45
    },
    {
      id: 'suggested-4',
      title: 'Airport pickup/drop-off',
      description: 'Private transportation to/from the airport.',
      price: 50
    },
    {
      id: 'suggested-5',
      title: 'Luggage storage',
      description: 'Store your luggage before check-in or after check-out.',
      price: 15
    }
  ]

  useEffect(() => {
    if (!user || !propertyId) return
    
    const fetchServices = async () => {
      try {
        setLoading(true)
        
        // Fetch property details to verify ownership and get name
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        if (propertyData.host_id !== user.id) {
          toast.error('Unauthorized access')
          router.push('/dashboard')
          return
        }
        
        setPropertyName(propertyData.name)
        
        // Fetch extra services
        const { data, error } = await supabase
          .from('extra_services')
          .select('*')
          .eq('property_id', propertyId)
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
        toast.error('Failed to load extra services')
      } finally {
        setLoading(false)
      }
    }
    
    fetchServices()
  }, [user, propertyId, router])
  
  const handleDeleteService = async (serviceId: string) => {
    try {
      // Prima recupero le foto associate al servizio
      const { data: photos, error: photosError } = await supabase
        .from('extra_service_photos')
        .select('*')
        .eq('service_id', serviceId)
      
      if (photosError) throw photosError
      
      // Log di debug - numero di foto trovate
      console.log(`Found ${photos?.length || 0} photos to delete for service ${serviceId}`);
      
      // Se ci sono foto associate, elimino ogni file dal bucket di storage
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          try {
            const photoUrl = photo.photo_path;
            console.log('Attempting to delete photo with URL:', photoUrl);
            
            // Metodo 1: Cerca la posizione della parte finale dell'URL
            let filePathToDelete = null;
            
            if (photoUrl.includes('extra-service-photos')) {
              // Trova l'indice dove inizia "extra-service-photos/" nell'URL
              const bucketPosition = photoUrl.indexOf('extra-service-photos/');
              
              if (bucketPosition !== -1) {
                // Prendi tutto ciò che segue "extra-service-photos/"
                filePathToDelete = photoUrl.substring(bucketPosition + 'extra-service-photos/'.length);
                console.log('Method 1 - Extracted path:', filePathToDelete);
              }
            }
            
            if (!filePathToDelete) {
              console.error('Could not extract file path from URL:', photoUrl);
              continue;
            }
            
            // Elimina il file dallo storage
            console.log('Attempting to delete file:', filePathToDelete);
            const { error: storageError, data: deleteData } = await supabase.storage
              .from('extra-service-photos')
              .remove([filePathToDelete]);
              
            if (storageError) {
              console.error('Error deleting photo from storage:', storageError);
            } else {
              console.log('Successfully deleted photo from storage:', deleteData);
            }
          } catch (photoError) {
            console.error('Error processing photo deletion:', photoError);
          }
        }
      }
      
      // Ora elimino il servizio dal database (dopo aver eliminato le foto)
      const { error } = await supabase
        .from('extra_services')
        .delete()
        .eq('id', serviceId)
      
      if (error) throw error
      
      setServices(services.filter(service => service.id !== serviceId))
      toast.success('Service deleted successfully')
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Failed to delete service')
    }
  }
  
  const handleAddSuggestedService = async (service: SuggestedService) => {
    try {
      const { data, error } = await supabase
        .from('extra_services')
        .insert([
          {
            property_id: propertyId,
            title: service.title,
            description: service.description,
            price: service.price,
            active: true
          }
        ])
        .select()
      
      if (error) throw error
      
      // Refresh services
      const { data: updatedServices, error: fetchError } = await supabase
        .from('extra_services')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setServices(updatedServices || [])
      
      toast.success('Service added successfully')
    } catch (error) {
      console.error('Error adding suggested service:', error)
      toast.error('Failed to add service')
    }
  }
  
  // Filter suggested services that haven't been already added (by title)
  const filteredSuggestedServices = suggestedServices.filter(
    suggestedService => !services.some(service => service.title === suggestedService.title)
  )

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <ProtectedRoute>
      <Layout title={`Extra Services - ${propertyName}`}>
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-[#5E2BFF] hover:underline mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Extra Services for {propertyName}</h1>
              <p className="text-gray-600 mt-1">Manage additional services to offer to your guests</p>
            </div>
            <Link href={`/dashboard/property/${propertyId}/extra-services/add`}>
              <button className="bg-[#ffde59] text-black px-4 py-2.5 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm mt-4 md:mt-0">
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Service
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading services...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Servizi dell'utente */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Extra Services</h2>
                
                {services.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <p className="text-gray-600">You haven't added any extra services yet.</p>
                    <p className="text-gray-500 mt-1">Add services to earn additional income from your guests.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800">{service.title}</h3>
                          <span className="text-sm font-bold text-[#5E2BFF] bg-purple-50 px-2 py-1 rounded-full">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        
                        {/* Service Photos Carousel (if available) */}
                        {servicePhotos[service.id] && servicePhotos[service.id].length > 0 && (
                          <div className="mt-3 mb-2 relative h-40 overflow-hidden rounded-lg">
                            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-full">
                              {servicePhotos[service.id].map((photo, index) => (
                                <div key={photo.id} className="w-full h-full flex-shrink-0 snap-center relative">
                                  <Image
                                    src={photo.photo_path}
                                    alt={photo.description || `Photo ${index + 1} of ${service.title}`}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                    style={{ objectFit: 'cover' }}
                                    className="rounded-lg"
                                  />
                                </div>
                              ))}
                            </div>
                            
                            {/* Photo count indicator */}
                            {servicePhotos[service.id].length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 rounded-full px-2 py-1 text-xs text-white">
                                {servicePhotos[service.id].length} photos
                              </div>
                            )}
                          </div>
                        )}
                        
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-2 mb-3 line-clamp-2">{service.description}</p>
                        )}
                        
                        <div className="flex justify-end mt-2 space-x-2">
                          <Link href={`/dashboard/property/${propertyId}/extra-services/edit/${service.id}`}>
                            <button className="text-[#5E2BFF] hover:bg-purple-50 font-bold text-sm px-2 py-1 rounded">
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              Edit
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-500 hover:bg-red-50 font-bold text-sm px-2 py-1 rounded"
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Servizi suggeriti */}
              {filteredSuggestedServices.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Suggested Services</h2>
                  <p className="text-gray-600 mb-6">Common services that hosts offer to their guests. Click "Add" to include them in your list.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuggestedServices.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{service.title}</h3>
                          <span className="text-sm font-bold text-[#5E2BFF] bg-white px-2 py-1 rounded-full shadow-sm">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                        
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleAddSuggestedService(service)}
                            className="bg-[#5E2BFF] text-white px-3 py-1.5 rounded hover:bg-[#4c22cc] transition duration-200 font-bold text-sm"
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add Service
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 