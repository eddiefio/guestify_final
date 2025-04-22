'use client'

import { useState, useRef } from 'react'
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
}

export default function AddExtraService() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { file: File; preview: string; uploading?: boolean }[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      price: 0
    }
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newPhotos = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setUploadedPhotos([...uploadedPhotos, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...uploadedPhotos]
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPhotos[index].preview)
    newPhotos.splice(index, 1)
    setUploadedPhotos(newPhotos)
  }
  
  const onSubmit = async (data: FormValues) => {
    if (!user || !propertyId) return
    
    try {
      setLoading(true)
      
      // Insert the new service
      const { data: serviceData, error } = await supabase
        .from('extra_services')
        .insert([
          {
            property_id: propertyId,
            title: data.title,
            description: data.description,
            price: data.price,
            active: true
          }
        ])
        .select()
      
      if (error) throw error

      // Upload photos if any exist
      if (uploadedPhotos.length > 0 && serviceData && serviceData.length > 0) {
        const serviceId = serviceData[0].id
        
        // Upload each photo and create database entries
        const photoPromises = uploadedPhotos.map(async (photo, index) => {
          try {
            // Mark photo as uploading
            setUploadedPhotos(prev => 
              prev.map((p, i) => i === index ? {...p, uploading: true} : p)
            )
            
            // Create a unique file name for the photo
            const fileExt = photo.file.name.split('.').pop()
            const fileName = `${serviceId}/${Date.now()}.${fileExt}`
            
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
              .insert([
                {
                  service_id: serviceId,
                  photo_path: publicUrlData.publicUrl,
                  display_order: index,
                }
              ])
              
            if (dbError) throw dbError
            
          } catch (err) {
            console.error('Error uploading photo:', err)
          } finally {
            // Mark as not uploading regardless of outcome
            setUploadedPhotos(prev => 
              prev.map((p, i) => i === index ? {...p, uploading: false} : p)
            )
          }
        })
        
        await Promise.all(photoPromises)
      }
      
      toast.success('Extra service added successfully')
      
      // Redirect back to the services list
      router.push(`/dashboard/property/${propertyId}/extra-services`)
    } catch (error) {
      console.error('Error adding extra service:', error)
      toast.error('Failed to add extra service')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout title="Add Extra Service">
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Extra Service</h1>
            
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

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Photos
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload photos that showcase your service. You can add multiple photos.
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
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden h-24 bg-gray-100">
                        <Image
                          src={photo.preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
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
                  disabled={loading}
                  className="px-4 py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-[#4c22cc] transition duration-200 font-bold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Add Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 