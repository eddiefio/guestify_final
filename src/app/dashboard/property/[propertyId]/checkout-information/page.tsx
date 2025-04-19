'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowUp, ArrowDown, Trash2, PenLine, Upload, MapPin, X } from 'lucide-react'

interface HouseInfoItem {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface CheckoutPhoto {
  id: string
  property_id: string
  section_type: string
  photo_url: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

type SectionType = 'checkout_time' | 'checkout_process'

export default function CheckoutInformation() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [checkoutInfo, setCheckoutInfo] = useState<{[key in SectionType]?: HouseInfoItem}>({})
  const [photos, setPhotos] = useState<{[key in SectionType]: CheckoutPhoto[]}>({
    checkout_time: [],
    checkout_process: []
  })
  const [loading, setLoading] = useState(true)
  const [uploadingSection, setUploadingSection] = useState<SectionType | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingSectionContent, setEditingSectionContent] = useState<SectionType | null>(null)
  const [sectionContent, setSectionContent] = useState('')
  const [editingPhotoDescription, setEditingPhotoDescription] = useState<string | null>(null)
  const [photoDescription, setPhotoDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SectionType>('checkout_time')
  const [isMobileView, setIsMobileView] = useState(false)

  // Carica i dati della proprietà e le informazioni di checkout
  useEffect(() => {
    if (!user || !propertyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Carica i dati della proprietà
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('host_id', user.id)
          .single()
        
        if (propertyError) throw propertyError
        if (!propertyData) {
          toast.error('Property not found or access denied')
          router.push('/dashboard')
          return
        }
        
        setProperty(propertyData)
        
        // Carica le informazioni di checkout dalle sezioni
        const { data: checkoutData, error: checkoutError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'checkout_information')
        
        if (checkoutError && checkoutError.code !== 'PGRST116') throw checkoutError
        
        const infoMap: {[key in SectionType]?: HouseInfoItem} = {}
        
        if (checkoutData && checkoutData.length > 0) {
          checkoutData.forEach((item: HouseInfoItem) => {
            try {
              // Prova a fare il parsing del campo content come JSON
              const parsedContent = JSON.parse(item.content);
              if (parsedContent && parsedContent.subtype && parsedContent.content) {
                const subtype = parsedContent.subtype as SectionType;
                
                // Crea un nuovo oggetto mantenendo l'ID originale ma aggiornando il content
                infoMap[subtype] = {
                  ...item,
                  section_type: subtype,
                  content: parsedContent.content
                };
              }
            } catch (e) {
              // Se non è in formato JSON, potrebbe essere un record salvato con il vecchio formato
              // In questo caso lo ignoriamo
              console.warn('Failed to parse content as JSON', e);
            }
          });
        }
        
        setCheckoutInfo(infoMap)
        
        // Carica le foto per ogni sezione
        const { data: photosData, error: photosError } = await supabase
          .from('checkout_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (photosError && photosError.code !== 'PGRST116') throw photosError
        
        const photosMap: {[key in SectionType]: CheckoutPhoto[]} = {
          checkout_time: [],
          checkout_process: []
        }
        
        if (photosData) {
          photosData.forEach((photo: CheckoutPhoto) => {
            if (photo.section_type in photosMap) {
              photosMap[photo.section_type as SectionType].push(photo)
            }
          })
        }
        
        setPhotos(photosMap)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user, router])

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Gestione upload foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, sectionType: SectionType) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    
    try {
      setUploading(true)
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${propertyId}/checkout/${sectionType}/${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload del file allo storage di Supabase
      const { error: uploadError } = await supabase.storage
        .from('property_media')
        .upload(filePath, file)
        
      if (uploadError) throw uploadError
      
      // Ottieni l'URL pubblico del file caricato
      const { data: { publicUrl } } = supabase.storage
        .from('property_media')
        .getPublicUrl(filePath)
      
      // Salva il riferimento nel database
      const { data, error } = await supabase
        .from('checkout_photos')
        .insert({
          property_id: propertyId,
          section_type: sectionType,
          photo_url: publicUrl,
          description: '',
          display_order: photos[sectionType].length
        })
        .select()
        
      if (error) throw error
      
      // Aggiorna lo state locale con la nuova foto
      if (data && data.length > 0) {
        setPhotos(prev => ({
          ...prev,
          [sectionType]: [...prev[sectionType], data[0]]
        }))
      }
      
      toast.success('Photo uploaded successfully')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      setUploadingSection(null)
      // Reset dell'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Gestione eliminazione foto
  const handleDeletePhoto = async (photoId: string, sectionType: SectionType) => {
    try {
      const photoToDelete = photos[sectionType].find(p => p.id === photoId)
      
      if (!photoToDelete) return
      
      // Elimina prima il record dal database
      const { error } = await supabase
        .from('checkout_photos')
        .delete()
        .eq('id', photoId)
        
      if (error) throw error
      
      // Aggiorna lo state locale rimuovendo la foto
      setPhotos(prev => ({
        ...prev,
        [sectionType]: prev[sectionType].filter(photo => photo.id !== photoId)
      }))
      
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  // Gestione aggiornamento descrizione foto
  const handleUpdatePhotoDescription = async (photoId: string, sectionType: SectionType) => {
    try {
      const { error } = await supabase
        .from('checkout_photos')
        .update({ description: photoDescription })
        .eq('id', photoId)
        
      if (error) throw error
      
      // Aggiorna lo state locale
      setPhotos(prev => ({
        ...prev,
        [sectionType]: prev[sectionType].map(photo => 
          photo.id === photoId 
            ? { ...photo, description: photoDescription } 
            : photo
        )
      }))
      
      setEditingPhotoDescription(null)
      toast.success('Description updated successfully')
    } catch (error) {
      console.error('Error updating photo description:', error)
      toast.error('Failed to update description')
    }
  }

  // Salva il contenuto della sezione
  const handleSaveSectionContent = async (sectionType: SectionType) => {
    try {
      // Prepara i dati da salvare
      const contentData = {
        subtype: sectionType,
        content: sectionContent
      }
      
      if (checkoutInfo[sectionType]) {
        // Aggiorna un record esistente
        const { error } = await supabase
          .from('house_info')
          .update({
            content: JSON.stringify(contentData),
            updated_at: new Date().toISOString()
          })
          .eq('id', checkoutInfo[sectionType]!.id)
        
        if (error) throw error
        
        setCheckoutInfo(prev => ({
          ...prev,
          [sectionType]: {
            ...prev[sectionType]!,
            content: sectionContent
          }
        }))
      } else {
        // Usiamo 'checkout_information' come section_type per rispettare il vincolo della tabella
        const { data, error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: 'checkout_information',
            content: JSON.stringify(contentData)
          })
          .select()
        
        if (error) throw error
        
        setCheckoutInfo(prev => ({
          ...prev,
          [sectionType]: {
            ...data[0],
            section_type: sectionType,
            content: sectionContent
          }
        }))
      }
      
      setEditingSectionContent(null)
      toast.success('Content saved successfully')
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
    }
  }

  // Titoli delle sezioni
  const getSectionTitle = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'checkout_time': return 'Checkout Time';
      case 'checkout_process': return 'Checkout Process';
      default: return 'Unknown Section';
    }
  }

  // Gestione riordinamento foto
  const movePhotoOrder = async (photoId: string, sectionType: SectionType, direction: 'up' | 'down') => {
    try {
      const sectionPhotos = [...photos[sectionType]]
      const currentIndex = sectionPhotos.findIndex(p => p.id === photoId)
      
      if (currentIndex === -1) return
      
      // Calcola il nuovo indice
      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(sectionPhotos.length - 1, currentIndex + 1)
      
      // Se non c'è cambiamento, esci
      if (newIndex === currentIndex) return
      
      // Scambia le foto
      const temp = sectionPhotos[newIndex]
      sectionPhotos[newIndex] = sectionPhotos[currentIndex]
      sectionPhotos[currentIndex] = temp
      
      // Aggiorna display_order per tutte le foto
      const updates = sectionPhotos.map((photo, index) => ({
        id: photo.id,
        display_order: index
      }))
      
      // Aggiorna nel database
      for (const update of updates) {
        const { error } = await supabase
          .from('checkout_photos')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          
        if (error) throw error
      }
      
      // Aggiorna lo state locale
      setPhotos(prev => ({
        ...prev,
        [sectionType]: sectionPhotos
      }))
      
    } catch (error) {
      console.error('Error reordering photos:', error)
      toast.error('Failed to reorder photos')
    }
  }

  // Rendering della sezione
  const renderSection = (sectionType: SectionType) => {
    const sectionInfo = checkoutInfo[sectionType]
    
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">{getSectionTitle(sectionType)} Instructions</h3>
          
          {editingSectionContent === sectionType ? (
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md min-h-[200px]"
                value={sectionContent}
                onChange={(e) => setSectionContent(e.target.value)}
                placeholder={`Enter ${getSectionTitle(sectionType).toLowerCase()} instructions...`}
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingSectionContent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveSectionContent(sectionType)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              {sectionInfo ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{sectionInfo.content}</div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No information provided yet</p>
              )}
              
              <button
                onClick={() => {
                  setSectionContent(sectionInfo?.content || '')
                  setEditingSectionContent(sectionType)
                }}
                className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <PenLine className="w-4 h-4 mr-1" />
                {sectionInfo ? 'Edit' : 'Add'} {getSectionTitle(sectionType).toLowerCase()} instructions
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Photos</h3>
            
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, sectionType)}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => {
                  setUploadingSection(sectionType)
                  fileInputRef.current?.click()
                }}
                disabled={uploading}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                {uploading && uploadingSection === sectionType ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Photo
                  </>
                )}
              </button>
            </div>
          </div>
          
          {photos[sectionType].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos[sectionType].map((photo, index) => (
                <div key={photo.id} className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="relative h-48">
                    <Image 
                      src={photo.photo_url} 
                      alt={photo.description || `${getSectionTitle(sectionType)} photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-3">
                    {editingPhotoDescription === photo.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={photoDescription}
                          onChange={(e) => setPhotoDescription(e.target.value)}
                          placeholder="Enter a description..."
                          rows={2}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingPhotoDescription(null)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdatePhotoDescription(photo.id, sectionType)}
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 mb-2">
                          {photo.description || <span className="italic text-gray-400">No description</span>}
                        </p>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={() => {
                              setPhotoDescription(photo.description || '')
                              setEditingPhotoDescription(photo.id)
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <PenLine className="w-3 h-3 inline mr-1" />
                            {photo.description ? 'Edit' : 'Add'} description
                          </button>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => movePhotoOrder(photo.id, sectionType, 'up')}
                              disabled={index === 0}
                              className={`text-gray-600 p-1 rounded ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => movePhotoOrder(photo.id, sectionType, 'down')}
                              disabled={index === photos[sectionType].length - 1}
                              className={`text-gray-600 p-1 rounded ${index === photos[sectionType].length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => handleDeletePhoto(photo.id, sectionType)}
                              className="text-red-600 p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Upload photos to help guests understand the checkout process</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Link 
              href={`/dashboard/property/${propertyId}/house-info`}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to House Info
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Checkout Information
            </h1>
            {property && (
              <p className="text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {property.name}
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <div className={`flex ${isMobileView ? 'overflow-x-auto' : 'flex-wrap'} border-b`}>
              <button 
                className={`p-4 font-medium flex-shrink-0 flex items-center ${activeTab === 'checkout_time' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('checkout_time')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Checkout Time
              </button>
              
              <button 
                className={`p-4 font-medium flex-shrink-0 flex items-center ${activeTab === 'checkout_process' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('checkout_process')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                Checkout Process
              </button>
            </div>
          </div>
          
          <div className="mb-8">
            {activeTab === 'checkout_time' && renderSection('checkout_time')}
            {activeTab === 'checkout_process' && renderSection('checkout_process')}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 