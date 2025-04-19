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

interface HouseInfoItem {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface CheckinPhoto {
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

type SectionType = 'access_and_keys' | 'checkin_time' | 'parking_info'

export default function CheckinInformation() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [checkinInfo, setCheckinInfo] = useState<{[key in SectionType]?: HouseInfoItem}>({})
  const [photos, setPhotos] = useState<{[key in SectionType]: CheckinPhoto[]}>({
    access_and_keys: [],
    checkin_time: [],
    parking_info: []
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
  const [activeTab, setActiveTab] = useState<SectionType>('access_and_keys')

  // Carica i dati della proprietà e le informazioni di checkin
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
        
        // Carica le informazioni di checkin dalle tre sezioni
        const { data: checkinData, error: checkinError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .in('section_type', ['access_and_keys', 'checkin_time', 'parking_info'])
        
        if (checkinError && checkinError.code !== 'PGRST116') throw checkinError
        
        const infoMap: {[key in SectionType]?: HouseInfoItem} = {}
        
        if (checkinData) {
          checkinData.forEach((item: HouseInfoItem) => {
            infoMap[item.section_type as SectionType] = item
          })
        }
        
        setCheckinInfo(infoMap)
        
        // Carica le foto per ogni sezione
        const { data: photosData, error: photosError } = await supabase
          .from('checkin_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (photosError) throw photosError
        
        const photosMap: {[key in SectionType]: CheckinPhoto[]} = {
          access_and_keys: [],
          checkin_time: [],
          parking_info: []
        }
        
        if (photosData) {
          photosData.forEach((photo: CheckinPhoto) => {
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

  // Gestione upload foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, sectionType: SectionType) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    
    try {
      setUploading(true)
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${propertyId}/checkin/${sectionType}/${Math.random().toString(36).substring(2)}.${fileExt}`
      
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
        .from('checkin_photos')
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
      
      // Elimina la foto dal storage di Supabase
      const photoUrl = photoToDelete.photo_url
      const storagePath = photoUrl.split('/').slice(-2).join('/')
      
      // Elimina il record dal database
      const { error } = await supabase
        .from('checkin_photos')
        .delete()
        .eq('id', photoId)
        
      if (error) throw error
      
      // Aggiorna lo state locale rimuovendo la foto
      setPhotos(prev => ({
        ...prev,
        [sectionType]: prev[sectionType].filter(p => p.id !== photoId)
      }))
      
      // Prova ad eliminare anche dal storage (può fallire se il percorso è errato, ma non è bloccante)
      try {
        await supabase.storage
          .from('property_media')
          .remove([storagePath])
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError)
      }
      
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  // Gestione aggiornamento descrizione foto
  const handleUpdatePhotoDescription = async (photoId: string, sectionType: SectionType) => {
    try {
      // Aggiorna la descrizione nel database
      const { error } = await supabase
        .from('checkin_photos')
        .update({ 
          description: photoDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', photoId)
        
      if (error) throw error
      
      // Aggiorna lo state locale
      setPhotos(prev => ({
        ...prev,
        [sectionType]: prev[sectionType].map(p => 
          p.id === photoId 
            ? {...p, description: photoDescription}
            : p
        )
      }))
      
      toast.success('Description updated successfully')
      setEditingPhotoDescription(null)
    } catch (error) {
      console.error('Error updating description:', error)
      toast.error('Failed to update description')
    }
  }

  // Gestione salvataggio contenuto sezione
  const handleSaveSectionContent = async (sectionType: SectionType) => {
    try {
      if (!sectionContent.trim()) {
        toast.error('Content cannot be empty')
        return
      }

      setLoading(true)
      
      if (checkinInfo[sectionType]) {
        // Aggiorna le informazioni esistenti
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: sectionContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkinInfo[sectionType]!.id)
        
        if (error) throw error
      } else {
        // Crea nuove informazioni
        const { data, error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: sectionType,
            content: sectionContent
          })
          .select()
        
        if (error) throw error
        
        if (data && data.length > 0) {
          setCheckinInfo(prev => ({
            ...prev,
            [sectionType]: data[0]
          }))
        }
      }
      
      toast.success('Information saved successfully')
      setEditingSectionContent(null)
    } catch (error) {
      console.error('Error saving information:', error)
      toast.error('Failed to save information')
    } finally {
      setLoading(false)
    }
  }

  // Funzione per ottenere il titolo della sezione
  const getSectionTitle = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'access_and_keys': return 'Access and Keys';
      case 'checkin_time': return 'Check-in Time';
      case 'parking_info': return 'Parking Information';
      default: return '';
    }
  }

  // Funzione per renderizzare una sezione
  const renderSection = (sectionType: SectionType) => {
    const sectionTitle = getSectionTitle(sectionType)
    const sectionPhotos = photos[sectionType]
    const sectionInfo = checkinInfo[sectionType]
    
    return (
      <div>
        {/* Foto della sezione */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Photos</h3>
            <button
              onClick={() => setUploadingSection(sectionType)}
              className="bg-[#5E2BFF] text-white px-3 py-1.5 rounded-lg hover:bg-[#4a22cd] transition font-bold text-sm"
              disabled={uploading}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Add Photo
            </button>
          </div>
          
          {uploadingSection === sectionType && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Upload a new photo</h4>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, sectionType)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#5E2BFF] file:text-white hover:file:bg-[#4a22cd]"
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2 flex items-center">
                  <div className="w-5 h-5 border-2 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              )}
              <div className="flex mt-3 justify-end">
                <button
                  onClick={() => setUploadingSection(null)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {sectionPhotos.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p className="text-gray-500">No photos added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sectionPhotos.map((photo) => (
                <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="relative aspect-video">
                    <Image
                      src={photo.photo_url}
                      alt={photo.description || 'Check-in photo'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4">
                    {editingPhotoDescription === photo.id ? (
                      <div>
                        <textarea
                          value={photoDescription}
                          onChange={(e) => setPhotoDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] resize-none text-sm"
                          placeholder="Add a description..."
                          rows={3}
                        ></textarea>
                        <div className="flex justify-end mt-2 space-x-2">
                          <button
                            onClick={() => setEditingPhotoDescription(null)}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdatePhotoDescription(photo.id, sectionType)}
                            className="bg-[#5E2BFF] text-white px-3 py-1 rounded-lg hover:bg-[#4a22cd] transition font-medium text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 text-sm mb-3">
                          {photo.description || 'No description added'}
                        </p>
                        <div className="flex justify-between">
                          <button
                            onClick={() => {
                              setEditingPhotoDescription(photo.id);
                              setPhotoDescription(photo.description || '');
                            }}
                            className="text-[#5E2BFF] text-xs font-medium"
                          >
                            Edit Description
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id, sectionType)}
                            className="text-red-500 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Informazioni testuali della sezione */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Information</h3>
            {!editingSectionContent && (
              <button
                onClick={() => {
                  setEditingSectionContent(sectionType);
                  setSectionContent(sectionInfo?.content || '');
                }}
                className="bg-[#5E2BFF] text-white px-3 py-1.5 rounded-lg hover:bg-[#4a22cd] transition font-bold text-sm"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                {sectionInfo ? 'Edit Information' : 'Add Information'}
              </button>
            )}
          </div>
          
          {editingSectionContent === sectionType ? (
            <div>
              <textarea
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] resize-none"
                placeholder={`Add ${sectionTitle} information...`}
                value={sectionContent}
                onChange={(e) => setSectionContent(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-3 space-x-3">
                <button
                  onClick={() => {
                    setEditingSectionContent(null);
                    setSectionContent('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveSectionContent(sectionType)}
                  className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div>
              {sectionInfo ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="prose max-w-none">
                    {sectionInfo.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700 text-sm last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500 mb-4">No information added yet</p>
                  <button 
                    onClick={() => {
                      setEditingSectionContent(sectionType);
                      setSectionContent('');
                    }}
                    className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold text-sm"
                  >
                    Add Information
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title={`Check-in Information - ${property?.name || 'Property'}`}>
        <div className="container mx-auto px-4 py-6 font-spartan">
          {/* Header con breadcrumb e nome proprietà */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Link href="/dashboard">
                <span className="hover:text-[#5E2BFF] transition">Dashboard</span>
              </Link>
              <svg className="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <Link href={`/dashboard/property/${propertyId}/house-info`}>
                <span className="hover:text-[#5E2BFF] transition">House Info</span>
              </Link>
              <svg className="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="font-medium">Check-in Information</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Check-in Information for {property?.name || 'Loading...'}
            </h1>
            <p className="text-gray-600">
              Provide your guests with detailed check-in instructions, including access methods, arrival times, and parking details.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading information...</p>
            </div>
          ) : (
            <div>
              {/* Schede in stile griglia, simili alla pagina Before You Leave */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-6 cursor-pointer h-full flex flex-col items-center ${activeTab === 'access_and_keys' ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                  onClick={() => setActiveTab('access_and_keys')}
                >
                  <div className="text-blue-500 mb-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Access & Keys</h2>
                  <p className="text-gray-600 text-center text-sm">Instructions for property access</p>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-6 cursor-pointer h-full flex flex-col items-center ${activeTab === 'checkin_time' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                  onClick={() => setActiveTab('checkin_time')}
                >
                  <div className="text-yellow-500 mb-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Check-in Time</h2>
                  <p className="text-gray-600 text-center text-sm">Arrival and check-in details</p>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-6 cursor-pointer h-full flex flex-col items-center ${activeTab === 'parking_info' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                  onClick={() => setActiveTab('parking_info')}
                >
                  <div className="text-green-500 mb-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Parking Information</h2>
                  <p className="text-gray-600 text-center text-sm">Details about parking options</p>
                </div>
              </div>

              {/* Contenuto in base alla scheda selezionata */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {activeTab === 'access_and_keys' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Access & Keys</h2>
                    <p className="text-gray-600 mb-6">
                      Provide your guests with clear instructions on how to access your property and use the keys.
                    </p>
                    {renderSection('access_and_keys')}
                  </div>
                )}

                {activeTab === 'checkin_time' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Check-in Time</h2>
                    <p className="text-gray-600 mb-6">
                      Specify your check-in time and any special instructions for arrival.
                    </p>
                    {renderSection('checkin_time')}
                  </div>
                )}

                {activeTab === 'parking_info' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Parking Information</h2>
                    <p className="text-gray-600 mb-6">
                      Provide details about parking options and any special parking instructions.
                    </p>
                    {renderSection('parking_info')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 