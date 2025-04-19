'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

export default function CheckinInformation() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [checkinInfo, setCheckinInfo] = useState<HouseInfoItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const { user } = useAuth()
  const router = useRouter()

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
        
        // Carica le informazioni di checkin
        const { data: checkinData, error: checkinError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'checkin_information')
          .single()
        
        if (checkinError && checkinError.code !== 'PGRST116') throw checkinError
        setCheckinInfo(checkinData || null)
        setContent(checkinData?.content || '')
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user, router])

  const handleSave = async () => {
    try {
      if (!content.trim()) {
        toast.error('Content cannot be empty')
        return
      }

      setLoading(true)
      
      if (checkinInfo) {
        // Aggiorna le informazioni esistenti
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkinInfo.id)
        
        if (error) throw error
      } else {
        // Crea nuove informazioni
        const { data, error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: 'checkin_information',
            content: content
          })
          .select()
        
        if (error) throw error
        setCheckinInfo(data[0] || null)
      }
      
      toast.success('Check-in information saved successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving information:', error)
      toast.error('Failed to save information')
    } finally {
      setLoading(false)
    }
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
            <div className="flex flex-wrap justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                Check-in Information
              </h1>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  {checkinInfo ? 'Edit Information' : 'Add Information'}
                </button>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Provide your guests with detailed check-in instructions
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading information...</p>
            </div>
          ) : isEditing ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Instructions
                </label>
                <textarea
                  id="content"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] resize-none"
                  placeholder="Provide detailed check-in instructions for your guests..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
                <p className="text-sm text-gray-500 mt-2">
                  Include information like: key pickup location, access codes, parking information, and anything else guests need to know for a smooth check-in.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setContent(checkinInfo?.content || '')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {checkinInfo ? (
                <div className="p-6">
                  <div className="prose max-w-none">
                    {checkinInfo.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="rounded-full bg-yellow-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">No Check-in Information Yet</h2>
                  <p className="text-gray-600 mb-6">
                    Help your guests have a smooth arrival by adding check-in instructions.
                  </p>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-[#5E2BFF] text-white px-6 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Check-in Information
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 