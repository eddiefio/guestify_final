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
  const [isMobileView, setIsMobileView] = useState(false)

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
          .eq('section_type', 'checkin_information')
        
        if (checkinError && checkinError.code !== 'PGRST116') throw checkinError
        
        const infoMap: {[key in SectionType]?: HouseInfoItem} = {}
        
        if (checkinData && checkinData.length > 0) {
          checkinData.forEach((item: HouseInfoItem) => {
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
      
      // Elimina prima il record dal database
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
      
      // Estrai il percorso dell'immagine dall'URL
      // L'URL è del tipo: https://fqjjivwdubseuwjonufk.supabase.co/storage/v1/object/public/property_media/PATH
      const photoUrl = photoToDelete.photo_url
      const filePathMatch = photoUrl.match(/\/property_media\/(.+)$/)
      
      if (filePathMatch && filePathMatch[1]) {
        // Elimina l'immagine dallo storage
        try {
          const { error: storageError } = await supabase.storage
            .from('property_media')
            .remove([filePathMatch[1]])
          
          if (storageError) {
            console.error('Errore durante l\'eliminazione dell\'immagine dallo storage:', storageError)
          }
        } catch (storageError) {
          console.error('Errore durante l\'eliminazione dell\'immagine dallo storage:', storageError)
        }
      } else {
        console.warn('Impossibile estrarre il percorso dell\'immagine dall\'URL:', photoUrl)
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
        // Prepara il contenuto in formato JSON
        const contentWithMetadata = JSON.stringify({
          subtype: sectionType,
          content: sectionContent
        });
        
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: contentWithMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkinInfo[sectionType]!.id)
        
        if (error) throw error
        
        // Aggiorna lo state locale
        setCheckinInfo(prev => ({
          ...prev,
          [sectionType]: {
            ...prev[sectionType]!,
            content: sectionContent
          }
        }));
      } else {
        // Crea nuove informazioni
        // Usiamo 'checkin_information' come section_type per rispettare il vincolo della tabella
        // e salviamo il sottotipo specifico come parte del contenuto in formato JSON
        const contentWithMetadata = JSON.stringify({
          subtype: sectionType,
          content: sectionContent
        });
        
        const { data, error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: 'checkin_information',
            content: contentWithMetadata
          })
          .select()
        
        if (error) throw error
        
        if (data && data.length > 0) {
          // Salviamo nei dati locali con l'adattamento del tipo per l'interfaccia utente
          setCheckinInfo(prev => ({
            ...prev,
            [sectionType]: {
              ...data[0],
              section_type: sectionType,
              content: sectionContent
            }
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

  // Gestione spostamento ordine delle foto
  const movePhotoOrder = async (photoId: string, sectionType: SectionType, direction: 'up' | 'down') => {
    const sectionPhotos = photos[sectionType]
    const index = sectionPhotos.findIndex(p => p.id === photoId)
    
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sectionPhotos.length - 1)
    ) return
    
    try {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const currentPhoto = sectionPhotos[index]
      const targetPhoto = sectionPhotos[targetIndex]
      
      // Scambia gli ordini
      const { error: error1 } = await supabase
        .from('checkin_photos')
        .update({ display_order: targetPhoto.display_order })
        .eq('id', currentPhoto.id)
      
      if (error1) throw error1
      
      const { error: error2 } = await supabase
        .from('checkin_photos')
        .update({ display_order: currentPhoto.display_order })
        .eq('id', targetPhoto.id)
      
      if (error2) throw error2
      
      // Aggiorna lo state locale
      const updatedPhotos = [...sectionPhotos]
      updatedPhotos[index] = {...updatedPhotos[index], display_order: targetPhoto.display_order}
      updatedPhotos[targetIndex] = {...updatedPhotos[targetIndex], display_order: currentPhoto.display_order}
      updatedPhotos.sort((a, b) => a.display_order - b.display_order)
      
      setPhotos(prev => ({
        ...prev,
        [sectionType]: updatedPhotos
      }))
      
      toast.success('Ordine foto aggiornato')
    } catch (error) {
      console.error('Errore durante lo spostamento della foto:', error)
      toast.error('Impossibile modificare l\'ordine delle foto')
    }
  }

  // Funzione per renderizzare una sezione
  const renderSection = (sectionType: SectionType) => {
    const sectionTitle = getSectionTitle(sectionType)
    const sectionPhotos = photos[sectionType]
    const sectionInfo = checkinInfo[sectionType]
    
    return (
      <div>
        {/* Informazioni testuali della sezione */}
        <div className="mb-8">
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
        
        {/* Foto della sezione con layout simile a DirectionsSection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Photos</h3>
            <button
              onClick={() => setUploadingSection(sectionType)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a22cd] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Add Photo
                </>
              )}
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
            <div className="text-center py-10 bg-gray-100 rounded-lg">
              <MapPin size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">
                No photos available for {sectionTitle}
              </p>
              <p className="text-gray-500 text-sm">
                Upload photos to help your guests with check-in information
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sectionPhotos.map((photo, index) => (
                <div key={photo.id} className="bg-white p-4 rounded-md shadow-sm">
                  <div className="flex flex-col md:flex-row md:gap-6">
                    <div className="md:w-1/3 mb-4 md:mb-0 relative">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={photo.photo_url}
                          alt={`${sectionTitle} photo ${index + 1}`}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => movePhotoOrder(photo.id, sectionType, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp size={18} />
                          </button>
                          <button
                            onClick={() => movePhotoOrder(photo.id, sectionType, 'down')}
                            disabled={index === sectionPhotos.length - 1}
                            className="p-1 text-gray-500 hover:text-[#5E2BFF] disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown size={18} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeletePhoto(photo.id, sectionType)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete photo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="md:w-2/3">
                      {editingPhotoDescription === photo.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={photoDescription}
                            onChange={(e) => setPhotoDescription(e.target.value)}
                            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                            placeholder="Add a description for this photo..."
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingPhotoDescription(null)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <X size={16} className="inline mr-1" />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdatePhotoDescription(photo.id, sectionType)}
                              className="px-3 py-1 bg-[#5E2BFF] text-white rounded-md text-sm hover:bg-[#4a22cd]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
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
                                setEditingPhotoDescription(photo.id);
                                setPhotoDescription(photo.description || '');
                              }}
                              className="p-1 text-[#5E2BFF] hover:text-[#4a22cd]"
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
          
          {sectionType !== 'checkin_time' && (
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Tips:</h4>
              <ul className="list-disc pl-5 text-sm text-blue-600 space-y-1">
                {sectionType === 'access_and_keys' && (
                  <>
                    <li>Upload clear photos of entrance, keys, lockboxes, or key pickup locations</li>
                    <li>Add detailed descriptions to help guests access your property easily</li>
                    <li>Include photos of any special instructions for entry systems or door codes</li>
                  </>
                )}
                {sectionType === 'parking_info' && (
                  <>
                    <li>Show clearly marked parking areas available for your guests</li>
                    <li>Include photos of parking spots, garages, or street parking options</li>
                    <li>Add any special instructions about parking permits or restrictions</li>
                  </>
                )}
                <li>Organize photos in logical order using the arrows</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title={`Check-in Information - ${property?.name || 'Property'}`} hasBackButton backUrl="/dashboard/property/${propertyId}/house-info">
        <div className="container mx-auto px-4 py-6 font-spartan">
          {/* Header con nome proprietà */}
          <div className="mb-6">
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
              {/* Schede in stile griglia, tutte visibili insieme su mobile */}
              <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'access_and_keys' ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                  onClick={() => setActiveTab('access_and_keys')}
                >
                  <div className="text-blue-500 mb-1 md:mb-2">
                    <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">Access & Keys</h2>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'checkin_time' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                  onClick={() => setActiveTab('checkin_time')}
                >
                  <div className="text-yellow-500 mb-1 md:mb-2">
                    <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">Check-in Time</h2>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'parking_info' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                  onClick={() => setActiveTab('parking_info')}
                >
                  <div className="text-green-500 mb-1 md:mb-2">
                    <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                    </svg>
                  </div>
                  <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">Parking Info</h2>
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