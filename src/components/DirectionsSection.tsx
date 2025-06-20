'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { MapPin, Car, Train, Upload, Trash2, PenLine, Plus, X, ArrowUp, ArrowDown } from 'lucide-react'
import Image from 'next/image'

interface DirectionsPhotoType {
  id: string
  property_id: string
  direction_type: 'driving' | 'train'
  photo_url: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

interface DirectionsSectionProps {
  propertyId: string
}

export default function DirectionsSection({ propertyId }: DirectionsSectionProps) {
  const [drivingPhotos, setDrivingPhotos] = useState<DirectionsPhotoType[]>([])
  const [trainPhotos, setTrainPhotos] = useState<DirectionsPhotoType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'driving' | 'train'>('driving')
  const [uploading, setUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<DirectionsPhotoType | null>(null)
  const [editDescription, setEditDescription] = useState<string>('')
  const [isMobileView, setIsMobileView] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDirectionsPhotos()
    
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [propertyId])

  const loadDirectionsPhotos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('directions_photos')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (error) throw error
      
      const driving = data?.filter((photo: DirectionsPhotoType) => photo.direction_type === 'driving') || []
      const train = data?.filter((photo: DirectionsPhotoType) => photo.direction_type === 'train') || []
      
      setDrivingPhotos(driving)
      setTrainPhotos(train)
    } catch (error) {
      console.error('Error loading direction photos:', error)
      toast.error('Unable to load direction photos')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    try {
      setUploading(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${propertyId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `directions/${fileName}`
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath)
      
      if (!urlData || !urlData.publicUrl) throw new Error('Unable to get public URL')
      
      // Calculate display_order (max + 1)
      const photos = activeTab === 'driving' ? drivingPhotos : trainPhotos
      const maxOrder = photos.length > 0 
        ? Math.max(...photos.map(p => p.display_order)) 
        : -1
      const newOrder = maxOrder + 1
      
      // Insert record in directions_photos table
      const { data, error } = await supabase
        .from('directions_photos')
        .insert({
          property_id: propertyId,
          direction_type: activeTab,
          photo_url: urlData.publicUrl,
          description: '',
          display_order: newOrder
        })
        .select()
      
      if (error) throw error
      
      toast.success('Photo uploaded successfully')
      
      // Update state
      loadDirectionsPhotos()
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
      
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Unable to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    
    try {
      // Find the photo to delete first to get the URL
      const photos = activeTab === 'driving' ? drivingPhotos : trainPhotos
      const photoToDelete = photos.find(p => p.id === photoId)
      
      if (!photoToDelete) return
      
      // Delete the record from the database first
      const { error } = await supabase
        .from('directions_photos')
        .delete()
        .eq('id', photoId)
      
      if (error) throw error
      
      // Extract the image path from the URL
      // URL format: https://fqjjivwdubseuwjonufk.supabase.co/storage/v1/object/public/property-photos/directions/FILE_NAME
      const photoUrl = photoToDelete.photo_url
      const filePathMatch = photoUrl.match(/\/property-photos\/(.+)$/)
      
      if (filePathMatch && filePathMatch[1]) {
        // Delete the image from storage
        try {
          const { error: storageError } = await supabase.storage
            .from('property-photos')
            .remove([filePathMatch[1]])
          
          if (storageError) {
            console.error('Error deleting image from storage:', storageError)
          }
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError)
          // Don't interrupt the flow if storage deletion fails
        }
      }
      
      toast.success('Photo deleted successfully')
      loadDirectionsPhotos()
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Unable to delete photo')
    }
  }

  const handleEditDescription = async () => {
    if (!editingPhoto) return
    
    try {
      const { error } = await supabase
        .from('directions_photos')
        .update({ description: editDescription })
        .eq('id', editingPhoto.id)
      
      if (error) throw error
      
      toast.success('Description updated successfully')
      setEditingPhoto(null)
      loadDirectionsPhotos()
    } catch (error) {
      console.error('Error updating description:', error)
      toast.error('Unable to update description')
    }
  }

  const movePhotoOrder = async (photoId: string, direction: 'up' | 'down') => {
    const photos = activeTab === 'driving' ? drivingPhotos : trainPhotos
    const index = photos.findIndex(p => p.id === photoId)
    
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === photos.length - 1)
    ) return
    
    try {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const currentPhoto = photos[index]
      const targetPhoto = photos[targetIndex]
      
      // Swap orders
      const { error: error1 } = await supabase
        .from('directions_photos')
        .update({ display_order: targetPhoto.display_order })
        .eq('id', currentPhoto.id)
      
      if (error1) throw error1
      
      const { error: error2 } = await supabase
        .from('directions_photos')
        .update({ display_order: currentPhoto.display_order })
        .eq('id', targetPhoto.id)
      
      if (error2) throw error2
      
      loadDirectionsPhotos()
    } catch (error) {
      console.error('Error moving photo:', error)
      toast.error('Unable to change photo order')
    }
  }

  const activePhotos = activeTab === 'driving' ? drivingPhotos : trainPhotos

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2BFF]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setActiveTab('driving')}
          className={`flex items-center px-4 py-2 rounded-full text-sm ${
            activeTab === 'driving' 
              ? 'bg-[#5E2BFF] text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Car size={16} className="mr-2" />
          Auto Directions
        </button>
        <button
          onClick={() => setActiveTab('train')}
          className={`flex items-center px-4 py-2 rounded-full text-sm ${
            activeTab === 'train' 
              ? 'bg-[#5E2BFF] text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Train size={16} className="mr-2" />
          Train Arrival
        </button>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">
            {activeTab === 'driving' 
              ? 'Auto Directions' 
              : 'Train Arrival Directions'}
          </h3>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </div>

        {activePhotos.length === 0 ? (
          <div className="text-center py-10 bg-gray-100 rounded-lg">
            <MapPin size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">
              No photos {activeTab === 'driving' ? 'for driving directions' : 'for train arrival'} available
            </p>
            <p className="text-gray-500 text-sm">
              Upload photos to help your guests easily find your property
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activePhotos.map((photo, index) => (
              <div key={photo.id} className="bg-white p-4 rounded-md shadow-sm">
                <div className="flex flex-col md:flex-row md:gap-6">
                  <div className="md:w-1/3 mb-4 md:mb-0 relative">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={photo.photo_url}
                        alt={`Direction ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => movePhotoOrder(photo.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button
                          onClick={() => movePhotoOrder(photo.id, 'down')}
                          disabled={index === activePhotos.length - 1}
                          className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown size={18} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete photo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    {editingPhoto?.id === photo.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                          placeholder="Add a description for this photo..."
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingPhoto(null)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <X size={16} className="inline mr-1" />
                            Cancel
                          </button>
                          <button
                            onClick={handleEditDescription}
                            className="px-3 py-1 bg-[#5E2BFF] text-white rounded-md text-sm hover:bg-[#4a21cc]"
                          >
                            <Save size={16} className="inline mr-1" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm text-gray-500">
                            Photo {index + 1}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingPhoto(photo)
                              setEditDescription(photo.description || '')
                            }}
                            className="p-1 text-[#5E2BFF] hover:text-[#4a21cc]"
                            title="Edit description"
                          >
                            <PenLine size={18} />
                          </button>
                        </div>
                        
                        {photo.description ? (
                          <p className="text-gray-700">{photo.description}</p>
                        ) : (
                          <p className="text-gray-400 italic">
                            No description. Click the pen icon to add one.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-700 mb-2">Tips:</h4>
        <ul className="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li>Upload clear photos that show easily identifiable landmarks</li>
          <li>Add detailed descriptions for each photo to facilitate orientation</li>
          <li>For driving directions, include photos of important intersections or road signs</li>
          <li>For train arrival, show the route from the station to the property</li>
          <li>Organize photos in chronological order using the up/down arrows</li>
        </ul>
      </div>
    </div>
  )
}

function Save(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
} 