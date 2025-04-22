'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import ProtectedRoute from '@/components/ProtectedRoute'
import Image from 'next/image'

type FormValues = {
  title: string
  description: string
  price: number
  active: boolean
}

type ServicePhoto = {
  id: string
  service_id: string
  photo_path: string
  description: string | null
  display_order: number
}

export default function EditExtraService() {
  const { propertyId, serviceId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<ServicePhoto[]>([])
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { file: File; preview: string; uploading?: boolean }[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>()
  
  // Fetch service details on page load
  useEffect(() => {
    if (!user || !propertyId || !serviceId) return
    
    const fetchServiceDetails = async () => {
      try {
        setLoading(true)
        
        // First verify property ownership
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('host_id')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        if (propertyData.host_id !== user.id) {
          toast.error('Unauthorized access')
          router.push('/dashboard')
          return
        }
        
        // Fetch service details
        const { data, error } = await supabase
          .from('extra_services')
          .select('*')
          .eq('id', serviceId)
          .eq('property_id', propertyId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          toast.error('Service not found')
          router.push(`/dashboard/property/${propertyId}/extra-services`)
          return
        }
        
        // Populate form
        setValue('title', data.title)
        setValue('description', data.description || '')
        setValue('price', data.price)
        setValue('active', data.active)
        
        // Fetch service photos
        const { data: photos, error: photosError } = await supabase
          .from('extra_service_photos')
          .select('*')
          .eq('service_id', serviceId)
          .order('display_order', { ascending: true })
          
        if (photosError) throw photosError
        
        setExistingPhotos(photos || [])
        
      } catch (error) {
        console.error('Error fetching service details:', error)
        toast.error('Failed to load service details')
        router.push(`/dashboard/property/${propertyId}/extra-services`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchServiceDetails()
  }, [user, propertyId, serviceId, router, setValue])

  // Gestione caricamento foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newPhotos = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setUploadedPhotos([...uploadedPhotos, ...newPhotos])
  }

  // Rimuove una foto caricata ma non ancora salvata
  const removeUploadedPhoto = (index: number) => {
    const newPhotos = [...uploadedPhotos]
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPhotos[index].preview)
    newPhotos.splice(index, 1)
    setUploadedPhotos(newPhotos)
  }
  
  // Aggiunge/rimuove una foto esistente dall'elenco di quelle da eliminare
  const toggleExistingPhotoDelete = (photoId: string) => {
    if (photosToDelete.includes(photoId)) {
      setPhotosToDelete(photosToDelete.filter(id => id !== photoId))
    } else {
      setPhotosToDelete([...photosToDelete, photoId])
    }
  }

  // Aggiorna l'ordine di visualizzazione delle foto
  const movePhotoOrder = async (photoId: string, direction: 'up' | 'down') => {
    const photoIndex = existingPhotos.findIndex(p => p.id === photoId)
    
    if (photoIndex === -1) return
    
    const newIndex = direction === 'up' 
      ? Math.max(0, photoIndex - 1) 
      : Math.min(existingPhotos.length - 1, photoIndex + 1)
      
    if (newIndex === photoIndex) return
    
    // Creare una copia dell'array per manipolarla
    const updatedPhotos = [...existingPhotos]
    
    // Eseguire lo scambio
    const temp = updatedPhotos[newIndex]
    updatedPhotos[newIndex] = updatedPhotos[photoIndex]
    updatedPhotos[photoIndex] = temp
    
    // Aggiornare i display_order
    updatedPhotos.forEach((photo, idx) => {
      photo.display_order = idx
    })
    
    try {
      // Aggiornare nel database
      for (const photo of updatedPhotos) {
        const { error } = await supabase
          .from('extra_service_photos')
          .update({ display_order: photo.display_order })
          .eq('id', photo.id)
          
        if (error) throw error
      }
      
      // Aggiornare lo stato locale
      setExistingPhotos(updatedPhotos)
      
    } catch (error) {
      console.error('Error updating photo order:', error)
      toast.error('Failed to update photo order')
    }
  }
  
  const onSubmit = async (data: FormValues) => {
    if (!user || !propertyId || !serviceId) return
    
    try {
      setSaving(true)
      
      // Update the service
      const { error } = await supabase
        .from('extra_services')
        .update({
          title: data.title,
          description: data.description,
          price: data.price,
          active: data.active
        })
        .eq('id', serviceId)
        .eq('property_id', propertyId)
      
      if (error) throw error
      
      // Delete marked photos from database and storage
      if (photosToDelete.length > 0) {
        for (const photoId of photosToDelete) {
          // Trova la foto da eliminare
          const photoToDelete = existingPhotos.find(p => p.id === photoId)
          
          if (photoToDelete) {
            try {
              // Estrai il percorso del file dall'URL
              const photoUrl = photoToDelete.photo_path;
              console.log('Photo URL from database:', photoUrl);
              
              // Per estrarre il percorso del file, consideriamo le diverse possibilità:
              let filePathToDelete = null;
              
              // Caso 1: Se l'URL è completo (contiene il bucket)
              if (photoUrl.includes('/storage/v1/object/public/extra-service-photos/')) {
                const parts = photoUrl.split('/extra-service-photos/');
                if (parts.length > 1) {
                  filePathToDelete = parts[1];
                  console.log('Extracted path from URL:', filePathToDelete);
                }
              } 
              // Caso 2: Se è già un percorso relativo (come nella pagina how-things-work)
              else if (!photoUrl.startsWith('http')) {
                filePathToDelete = photoUrl;
                console.log('Using direct path:', filePathToDelete);
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
              
              // Elimina la foto dal database
              const { error: dbError } = await supabase
                .from('extra_service_photos')
                .delete()
                .eq('id', photoId)
                
              if (dbError) {
                console.error('Error deleting photo from database:', dbError);
                throw dbError;
              }
              
            } catch (error) {
              console.error('Error deleting photo:', error);
              toast.error('Errore nell\'eliminazione di una foto');
            }
          }
        }
      }
      
      // Upload new photos
      if (uploadedPhotos.length > 0) {
        // Upload each photo and create database entries
        for (let i = 0; i < uploadedPhotos.length; i++) {
          const photo = uploadedPhotos[i]
          
          try {
            // Create a unique file name for the photo
            const fileExt = photo.file.name.split('.').pop()
            const fileName = `${serviceId}/${Date.now()}_${i}.${fileExt}`
            
            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('extra-service-photos')
              .upload(fileName, photo.file)
              
            if (uploadError) throw uploadError
            
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('extra-service-photos')
              .getPublicUrl(fileName)
              
            // Create database entry
            const { error: dbError } = await supabase
              .from('extra_service_photos')
              .insert([{
                service_id: serviceId as string,
                photo_path: publicUrlData.publicUrl,
                display_order: existingPhotos.length + i - photosToDelete.length,
              }])
              
            if (dbError) throw dbError
          } catch (err) {
            console.error('Error uploading photo:', err)
          }
        }
      }
      
      toast.success('Extra service updated successfully')
      
      // Redirect back to the services list
      router.push(`/dashboard/property/${propertyId}/extra-services`)
    } catch (error) {
      console.error('Error updating extra service:', error)
      toast.error('Failed to update extra service')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout title="Edit Extra Service">
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex items-center mb-8">
            <Link 
              href={`/dashboard/property/${propertyId}/extra-services`} 
              className="inline-flex items-center text-[#5E2BFF] hover:underline"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to Extra Services
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Extra Service</h1>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title', { 
                      required: 'Title is required',
                      maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="e.g. Airport Transfer"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register('description', { 
                      maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
                    })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="Provide details about this service"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (€) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      {...register('price', { 
                        required: 'Price is required',
                        min: { value: 0, message: 'Price cannot be negative' },
                        valueAsNumber: true
                      })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Remember: Guestify takes a 12% commission on all extra service bookings.</p>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="active"
                    type="checkbox"
                    {...register('active')}
                    className="h-4 w-4 text-[#5E2BFF] focus:ring-[#5E2BFF] border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Active (available for booking)
                  </label>
                </div>
                
                {/* Existing Photos */}
                {existingPhotos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Photos
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {existingPhotos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className={`relative rounded-lg overflow-hidden border ${
                            photosToDelete.includes(photo.id) ? 'opacity-50 border-red-300' : 'border-gray-200'
                          }`}
                        >
                          <div className="relative aspect-[4/3] w-full">
                            <Image
                              src={photo.photo_path}
                              alt={photo.description || `Photo of service`}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded-lg"
                            />
                          </div>
                          
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button
                              type="button"
                              onClick={() => toggleExistingPhotoDelete(photo.id)}
                              className={`p-1 rounded-full shadow-md ${
                                photosToDelete.includes(photo.id) 
                                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                                  : 'bg-white hover:bg-red-100 text-red-500'
                              }`}
                              title={photosToDelete.includes(photo.id) ? "Restore photo" : "Delete photo"}
                              disabled={saving}
                            >
                              {photosToDelete.includes(photo.id) ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              )}
                            </button>
                          </div>
                          
                          <div className="p-2 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Photo {index + 1}</span>
                              <div className="flex space-x-1">
                                <button 
                                  type="button"
                                  onClick={() => movePhotoOrder(photo.id, 'up')}
                                  disabled={index === 0 || saving}
                                  className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                                  title="Move up"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                  </svg>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => movePhotoOrder(photo.id, 'down')}
                                  disabled={index === existingPhotos.length - 1 || saving}
                                  className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                                  title="Move down"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {photosToDelete.length > 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        {photosToDelete.length} photo(s) marked for deletion. Changes will apply when you save.
                      </p>
                    )}
                  </div>
                )}

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Photos
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload additional photos for this service.
                  </p>
                  
                  <div className="flex items-center justify-center w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:border-[#5E2BFF] transition w-full flex flex-col items-center justify-center"
                    >
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>Click to upload photos</span>
                      <span className="text-xs mt-1">JPG, PNG, WebP up to 5MB</span>
                    </button>
                  </div>
                  
                  {uploadedPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                          <div className="relative aspect-[4/3] w-full">
                            <Image
                              src={photo.preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded-lg"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedPhoto(index)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                            disabled={saving}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                          <div className="p-2 bg-gray-50">
                            <span className="text-xs text-gray-500">New photo {index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Link href={`/dashboard/property/${propertyId}/extra-services`}>
                    <button 
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-[#4c22cc] transition duration-200 font-bold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Update Service'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 