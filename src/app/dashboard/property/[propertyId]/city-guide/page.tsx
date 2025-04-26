'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'

type CityGuide = {
  id: string
  title: string
  file_path: string
  property_id: string
  created_at: string
}

export default function CityGuides() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [guides, setGuides] = useState<CityGuide[]>([])
  const [propertyName, setPropertyName] = useState('')
  
  useEffect(() => {
    if (!user || !propertyId) return
    
    const fetchGuides = async () => {
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
        
        // Fetch city guides
        const { data, error } = await supabase
          .from('city_guides')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setGuides(data || [])
        
      } catch (error) {
        console.error('Error fetching city guides:', error)
        toast.error('Failed to load city guides')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGuides()
  }, [user, propertyId, router])
  
  const handleDeleteGuide = async (guideId: string, filePath: string) => {
    try {
      // Prima eliminiamo il file dallo storage
      if (filePath) {
        const { error: storageError } = await supabase
          .storage
          .from('city-guides')
          .remove([filePath.replace('city-guides/', '')])
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
          // Continuiamo comunque con l'eliminazione del record
        }
      }
      
      // Poi eliminiamo il record dal database
      const { error } = await supabase
        .from('city_guides')
        .delete()
        .eq('id', guideId)
      
      if (error) throw error
      
      setGuides(guides.filter(guide => guide.id !== guideId))
      toast.success('Guide deleted successfully')
    } catch (error) {
      console.error('Error deleting guide:', error)
      toast.error('Failed to delete guide')
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout title={`Host Guides - ${propertyName}`} hasBackButton backUrl="/dashboard">
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Host Guides for {propertyName}</h1>
              <p className="text-gray-600 mt-1">Manage your city guides for guests</p>
            </div>
            <Link href={`/dashboard/property/${propertyId}/city-guide/add`}>
              <button className="bg-[#ffde59] text-black px-4 py-2.5 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm mt-4 md:mt-0">
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Guide
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading guides...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Guides dell'utente */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Host Guides</h2>
                
                {guides.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                    <p className="text-gray-600">You haven't added any city guides yet.</p>
                    <p className="text-gray-500 mt-1">Add guides to help your guests discover your city.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guides.map((guide) => (
                      <div key={guide.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="mr-3 text-purple-600">
                              {guide.file_path.endsWith('.pdf') ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                                </svg>
                              ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                                </svg>
                              )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">{guide.title}</h3>
                          </div>
                          <div className="flex space-x-2">
                            <a 
                              href={supabase.storage.from('city-guides').getPublicUrl(guide.file_path.replace('city-guides/', '')).data.publicUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline font-bold text-sm px-2 py-1"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              View
                            </a>
                            <Link href={`/dashboard/property/${propertyId}/city-guide/edit/${guide.id}`}>
                              <button className="text-[#5E2BFF] hover:underline font-bold text-sm px-2 py-1">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Edit
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleDeleteGuide(guide.id, guide.file_path)}
                              className="text-red-500 hover:underline font-bold text-sm px-2 py-1"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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