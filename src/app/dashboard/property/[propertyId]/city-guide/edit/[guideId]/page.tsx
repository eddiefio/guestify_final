'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function EditCityGuide() {
  const { propertyId, guideId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState('')
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  useEffect(() => {
    const fetchGuide = async () => {
      if (!user || !propertyId || !guideId) return
      
      try {
        setLoading(true)
        
        // Prima verifichiamo che l'utente sia il proprietario
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('host_id')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        if (propertyData.host_id !== user?.id) {
          toast.error('Unauthorized access')
          router.push('/dashboard')
          return
        }
        
        // Otteniamo i dati della guida
        const { data, error } = await supabase
          .from('city_guides')
          .select('*')
          .eq('id', guideId)
          .eq('property_id', propertyId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          toast.error('City guide not found')
          router.push(`/dashboard/property/${propertyId}/city-guide`)
          return
        }
        
        // Impostiamo i dati nel form
        setTitle(data.title)
        setCurrentFilePath(data.file_path)
        
        // Impostiamo il preview del file
        if (data.file_path) {
          if (data.file_path.endsWith('.pdf')) {
            setFilePreview('pdf')
          } else if (data.file_path.match(/\.(jpe?g|png)$/i)) {
            const { data: publicUrl } = supabase.storage
              .from('city-guides')
              .getPublicUrl(data.file_path.replace('city-guides/', ''))
            
            setFilePreview(publicUrl.publicUrl)
          }
        }
        
      } catch (error) {
        console.error('Error fetching city guide:', error)
        toast.error('Failed to load city guide')
        router.push(`/dashboard/property/${propertyId}/city-guide`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGuide()
  }, [user, propertyId, guideId, router])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Verifica che il file sia un PDF o un'immagine
      if (!selectedFile.type.match('application/pdf|image/jpeg|image/png|image/jpg')) {
        toast.error('Please select a PDF or image file (JPEG, PNG)')
        return
      }
      
      setFile(selectedFile)
      
      // Mostra anteprima per le immagini
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        // Per i PDF mostriamo solo l'icona
        setFilePreview('pdf')
      }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    try {
      setUploading(true)
      
      let filePath = currentFilePath
      
      // Se è stato selezionato un nuovo file, lo carichiamo
      if (file) {
        // Prima eliminiamo il file vecchio se esiste
        if (currentFilePath) {
          await supabase
            .storage
            .from('city-guides')
            .remove([currentFilePath.replace('city-guides/', '')])
            .catch((error: unknown) => {
              console.error('Error deleting old file:', error)
              // Continuiamo comunque con l'aggiornamento
            })
        }
        
        // Carichiamo il nuovo file
        const fileExt = file.name.split('.').pop()
        const fileName = `${propertyId}/${Date.now()}.${fileExt}`
        
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('city-guides')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (fileError) throw fileError
        
        filePath = `city-guides/${fileName}`
      }
      
      // Aggiorniamo il record nel database
      const { error } = await supabase
        .from('city_guides')
        .update({
          title,
          file_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', guideId)
        .eq('property_id', propertyId)
      
      if (error) throw error
      
      toast.success('City guide updated successfully')
      router.push(`/dashboard/property/${propertyId}/city-guide`)
      
    } catch (error) {
      console.error('Error updating city guide:', error)
      toast.error('Failed to update city guide')
    } finally {
      setUploading(false)
    }
  }
  
  const fileIsImage = (path: string) => {
    return path.match(/\.(jpe?g|png)$/i) !== null
  }
  
  return (
    <ProtectedRoute>
      <Layout title="Edit City Guide - Guestify">
        <div className="container mx-auto px-4 py-6 font-spartan">
          <Link 
            href={`/dashboard/property/${propertyId}/city-guide`} 
            className="inline-flex items-center text-[#5E2BFF] hover:underline mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to City Guides
          </Link>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit City Guide</h1>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Loading guide data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="Enter guide title"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-2">
                    Current File
                  </label>
                  
                  <div className="p-4 border border-gray-200 rounded-lg mb-4">
                    <div className="flex items-center">
                      <div className="mr-3 text-purple-600">
                        {currentFilePath.endsWith('.pdf') ? (
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {currentFilePath.split('/').pop()}
                        </p>
                        <a
                          href={supabase.storage.from('city-guides').getPublicUrl(currentFilePath.replace('city-guides/', '')).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-xs hover:underline"
                        >
                          View current file
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <label htmlFor="guide" className="block text-gray-700 font-bold mb-2">
                    Upload New Guide (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {file && filePreview ? (
                        <div className="mb-3">
                          {filePreview === 'pdf' ? (
                            <div className="mx-auto flex items-center justify-center">
                              <svg className="h-16 w-16 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                          ) : (
                            <img 
                              src={filePreview} 
                              alt="Preview" 
                              className="mx-auto h-32 object-contain rounded" 
                            />
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {file?.name} - {(file?.size !== undefined ? (file.size / 1024 / 1024).toFixed(2) : '0')} MB
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null)
                              setFilePreview(null)
                            }}
                            className="text-sm text-red-500 hover:text-red-700 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#5E2BFF] hover:text-indigo-500 focus-within:outline-none">
                              <span>Upload a new file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Link href={`/dashboard/property/${propertyId}/city-guide`}>
                    <button 
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg mr-4 hover:bg-gray-50 transition font-bold"
                    >
                      Cancel
                    </button>
                  </Link>
                  <button
                    type="submit"
                    className="bg-[#5E2BFF] text-white px-6 py-2 rounded-lg hover:bg-[#4920c4] transition font-bold disabled:opacity-70"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : 'Update Guide'}
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