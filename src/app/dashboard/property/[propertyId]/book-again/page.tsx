'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Calendar, Image, Trash2, Upload, PenLine, Link2 } from 'lucide-react'

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

interface BookAgainInfo {
  id: string
  property_id: string
  section_type: string
  content: string
  image_url?: string
  created_at: string
  updated_at: string
}

interface PropertyLink {
  id?: string
  property_id?: string
  title: string
  url: string
}

export default function BookAgain() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [bookAgainInfo, setBookAgainInfo] = useState<BookAgainInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [propertyLinks, setPropertyLinks] = useState<PropertyLink[]>([])
  const [newLink, setNewLink] = useState<PropertyLink>({ title: '', url: '' })
  const { user } = useAuth()
  const router = useRouter()

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
        
        // Carica le informazioni di "Book again"
        const { data: bookAgainData, error: bookAgainError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'book_again')
          .single()
        
        if (bookAgainError && bookAgainError.code !== 'PGRST116') { // PGRST116 è l'errore quando non viene trovato nulla
          throw bookAgainError
        }
        
        if (bookAgainData) {
          setBookAgainInfo(bookAgainData)
          
          try {
            // Tenta di analizzare i dati JSON dal campo content
            const parsedData = JSON.parse(bookAgainData.content)
            setContent(parsedData.text || '')
            setImageUrl(parsedData.image_url || null)
          } catch (e) {
            console.error('Failed to parse book again data:', e)
            setContent('')
            setImageUrl(null)
          }
        }

        // Carica i link degli annunci della proprietà
        const { data: linksData, error: linksError } = await supabase
          .from('property_listing_links')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: true })
        
        if (linksError) throw linksError
        
        if (linksData && linksData.length > 0) {
          setPropertyLinks(linksData)
        } else {
          setPropertyLinks([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load property information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user, router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
      
      // Crea un'anteprima dell'immagine
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const uploadImage = async () => {
    if (!image) return null
    
    try {
      setIsUploading(true)
      const fileExt = image.name.split('.').pop()
      const fileName = `${propertyId}/${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase
        .storage
        .from('property-photos')
        .upload(fileName, image)
      
      if (uploadError) throw uploadError
      
      // Ottieni l'URL pubblico dell'immagine
      const { data } = supabase
        .storage
        .from('property-photos')
        .getPublicUrl(fileName)
      
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async () => {
    if (!imageUrl || !bookAgainInfo) return
    
    try {
      // Estrai il percorso dell'immagine dall'URL
      const urlParts = imageUrl.split('property-photos/')[1]
      
      if (urlParts) {
        const { error } = await supabase
          .storage
          .from('property-photos')
          .remove([urlParts])
        
        if (error) throw error
        
        // Aggiorna il record nel database
        const contentData = { text: content, image_url: null }
        
        const { error: updateError } = await supabase
          .from('house_info')
          .update({ 
            content: JSON.stringify(contentData),
            updated_at: new Date().toISOString()
          })
          .eq('id', bookAgainInfo.id)
        
        if (updateError) throw updateError
        
        setImageUrl(null)
        setImage(null)
        toast.success('Image deleted successfully')
        
        // Aggiorna lo stato locale
        if (bookAgainInfo) {
          setBookAgainInfo({
            ...bookAgainInfo,
            content: JSON.stringify(contentData)
          })
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error('Please enter both title and URL')
      return
    }

    // Validazione semplice dell'URL
    try {
      new URL(newLink.url)
    } catch (e) {
      toast.error('Please enter a valid URL (e.g. https://example.com)')
      return
    }

    setPropertyLinks([...propertyLinks, { ...newLink }])
    setNewLink({ title: '', url: '' })
  }

  const handleRemoveLink = (index: number) => {
    const updatedLinks = [...propertyLinks]
    updatedLinks.splice(index, 1)
    setPropertyLinks(updatedLinks)
  }

  const savePropertyLinks = async () => {
    if (!propertyId) return

    try {
      // Elimina i link esistenti
      const { error: deleteError } = await supabase
        .from('property_listing_links')
        .delete()
        .eq('property_id', propertyId)

      if (deleteError) throw deleteError

      // Aggiungi i nuovi link
      if (propertyLinks.length > 0) {
        const linksWithPropertyId = propertyLinks.map(link => ({
          ...link,
          property_id: propertyId
        }))

        const { error: insertError } = await supabase
          .from('property_listing_links')
          .insert(linksWithPropertyId)

        if (insertError) throw insertError
      }

      return true
    } catch (error) {
      console.error('Error saving property links:', error)
      toast.error('Failed to save property links')
      return false
    }
  }

  const handleSave = async () => {
    try {
      let uploadedImageUrl = imageUrl
      
      // Se c'è una nuova immagine da caricare
      if (image) {
        uploadedImageUrl = await uploadImage()
        if (!uploadedImageUrl && imageUrl) {
          // Mantiene l'URL esistente se l'upload fallisce
          uploadedImageUrl = imageUrl
        }
      }
      
      // Salva i link delle proprietà prima di tutto il resto
      const linksSaved = await savePropertyLinks()
      if (!linksSaved) {
        return
      }
      
      const contentData = {
        text: content,
        image_url: uploadedImageUrl
      }
      
      if (bookAgainInfo) {
        // Aggiorna il record esistente
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: JSON.stringify(contentData),
            updated_at: new Date().toISOString()
          })
          .eq('id', bookAgainInfo.id)
        
        if (error) throw error
      } else {
        // Crea un nuovo record
        const { error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: 'book_again',
            content: JSON.stringify(contentData)
          })
        
        if (error) throw error
        
        // Aggiorna lo state con i nuovi dati
        const { data, error: fetchError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'book_again')
          .single()
        
        if (fetchError) throw fetchError
        
        setBookAgainInfo(data)
      }
      
      setIsEditing(false)
      toast.success('Book again information saved successfully')
      setImage(null) // Resetta l'immagine dopo il salvataggio
    } catch (error) {
      console.error('Error saving book again info:', error)
      toast.error('Failed to save book again information')
    }
  }

  return (
    <ProtectedRoute>
      <Layout title={`Book Again - ${property?.name || 'Property'}`} hasBackButton backUrl={`/dashboard/property/${propertyId}/house-info`}>
        <div className="container mx-auto px-4 py-6 font-spartan">
          {/* Header con nome proprietà */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-7 h-7 mr-2 text-violet-500" />
              Book Again for {property?.name || 'Loading...'}
            </h1>
            <p className="text-gray-600 mt-1">
              Help your guests book their next stay with you, providing a memorable photo and booking information.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading book again information...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Booking Information</h2>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                      placeholder="Enter your booking information here... (How to book again, special offers for returning guests, etc.)"
                    />
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Property Listing Links</h2>
                    <p className="text-gray-600 mb-4">Add links to your property listings on various platforms.</p>
                    
                    {propertyLinks.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {propertyLinks.map((link, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{link.title}</p>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#5E2BFF] text-sm hover:underline break-all"
                              >
                                {link.url}
                              </a>
                            </div>
                            <button
                              onClick={() => handleRemoveLink(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove link"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                      <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center">
                        <Link2 className="w-5 h-5 mr-2 text-violet-500" />
                        Add New Link
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newLink.title}
                            onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                            placeholder="E.g. Airbnb Listing, Booking.com, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            URL
                          </label>
                          <input
                            type="url"
                            value={newLink.url}
                            onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                            placeholder="https://example.com/your-listing"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAddLink}
                        className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold flex items-center"
                      >
                        Add Link
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Photo</h2>
                    <div className="mb-4">
                      {imageUrl ? (
                        <div className="relative">
                          <img 
                            src={imageUrl} 
                            alt="Book Again" 
                            className="w-full max-w-md h-auto rounded-lg shadow-sm"
                          />
                          <button
                            onClick={deleteImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                            title="Remove photo"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <div className="flex flex-col items-center">
                            <Image className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-gray-500 mb-2">No photo uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <label className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold cursor-pointer flex items-center w-fit">
                        <Upload className="w-4 h-4 mr-2" />
                        {imageUrl ? 'Change Photo' : 'Upload Photo'}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="text-gray-500 text-sm mt-2">
                        Upload an attractive photo to entice guests to book with you again.
                        Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={isUploading}
                      className={`bg-[#5E2BFF] text-white px-6 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold flex items-center ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Book Again Information</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold flex items-center"
                    >
                      <PenLine className="w-4 h-4 mr-2" />
                      {bookAgainInfo ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  
                  {!bookAgainInfo ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No booking information has been added yet.</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Add information to help your guests book with you again.
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
                      >
                        Add Book Again Information
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {imageUrl && (
                        <div className="mb-6">
                          <img 
                            src={imageUrl} 
                            alt="Book Again" 
                            className="w-full max-w-2xl h-auto rounded-lg shadow-sm mb-4"
                          />
                        </div>
                      )}
                      
                      <div className="bg-violet-50 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Booking Information</h3>
                        <div className="prose max-w-none text-gray-700">
                          {content.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-2">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>

                      {propertyLinks.length > 0 && (
                        <div className="bg-violet-50 rounded-lg p-6 mt-4">
                          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <Link2 className="w-5 h-5 mr-2 text-violet-500" />
                            Property Listing Links
                          </h3>
                          <div className="space-y-4">
                            {propertyLinks.map((link, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="font-semibold text-gray-800 mb-1">{link.title}</p>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#5E2BFF] hover:underline break-all"
                                >
                                  {link.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 