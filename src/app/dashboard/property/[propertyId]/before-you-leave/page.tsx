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
import ProvidedItemsSection from '@/components/ProvidedItemsSection'
import InformationNeededSection from '@/components/InformationNeededSection'
import DirectionsSection from '@/components/DirectionsSection'

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

interface HouseInfoItem {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface ProvidedCategory {
  id: string
  property_id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
  items: ProvidedItem[]
}

interface ProvidedItem {
  id: string
  category_id: string
  name: string
  description: string | null
  quantity: number
  display_order: number
  created_at: string
  updated_at: string
}

interface DirectionPhoto {
  id: string
  property_id: string
  direction_type: 'driving' | 'train'
  photo_url: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export default function BeforeYouLeave() {
  const { propertyId } = useParams()
  const [activeTab, setActiveTab] = useState<'whats-provided' | 'info-needed' | 'how-to-get'>('whats-provided')
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  // Carica i dati della proprietà
  useEffect(() => {
    if (!user || !propertyId) return

    const fetchPropertyData = async () => {
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
      } catch (error) {
        console.error('Error fetching property data:', error)
        toast.error('Failed to load property information')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId, user, router])

  return (
    <ProtectedRoute>
      <Layout title={`Before You Leave Home - ${property?.name || 'Property'}`}>
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
              <span className="font-medium">Before You Leave Home</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Before You Leave Home - {property?.name || 'Loading...'}
            </h1>
            <p className="text-gray-600">
              Provide useful information for your guests before they leave, including what's provided at your property, information you need to know, and directions.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading information...</p>
            </div>
          ) : (
            <div>
              {/* Schede in stile griglia, simili all'immagine di riferimento */}
              <div className="flex flex-nowrap overflow-x-auto md:grid md:grid-cols-3 gap-6 mb-8 hide-scrollbar">
                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-4 md:p-6 cursor-pointer h-full flex-shrink-0 flex flex-col items-center justify-center w-1/3 min-w-[120px] md:w-auto ${activeTab === 'whats-provided' ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                  onClick={() => setActiveTab('whats-provided')}
                >
                  <div className="text-blue-500 mb-2">
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-gray-800 text-center">What's Provided</h2>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-4 md:p-6 cursor-pointer h-full flex-shrink-0 flex flex-col items-center justify-center w-1/3 min-w-[120px] md:w-auto ${activeTab === 'info-needed' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                  onClick={() => setActiveTab('info-needed')}
                >
                  <div className="text-yellow-500 mb-2">
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-gray-800 text-center">Info We Need</h2>
                </div>

                <div 
                  className={`rounded-xl shadow hover:shadow-md transition p-4 md:p-6 cursor-pointer h-full flex-shrink-0 flex flex-col items-center justify-center w-1/3 min-w-[120px] md:w-auto ${activeTab === 'how-to-get' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                  onClick={() => setActiveTab('how-to-get')}
                >
                  <div className="text-green-500 mb-2">
                    <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-gray-800 text-center">How To Get There</h2>
                </div>
              </div>

              {/* Contenuto in base alla scheda selezionata */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {activeTab === 'whats-provided' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">What's Provided</h2>
                    <p className="text-gray-600 mb-6">
                      Gestione delle categorie e degli articoli forniti nella tua proprietà.
                    </p>
                    <ProvidedItemsSection propertyId={propertyId as string} />
                  </div>
                )}

                {activeTab === 'info-needed' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Information We Need to Know</h2>
                    <p className="text-gray-600 mb-6">
                      Fai sapere ai tuoi ospiti quali informazioni ti servono prima del loro arrivo.
                    </p>
                    <InformationNeededSection propertyId={propertyId as string} />
                  </div>
                )}

                {activeTab === 'how-to-get' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">How To Get There</h2>
                    <p className="text-gray-600 mb-6">
                      Fornisci indicazioni per raggiungere la tua proprietà in auto o in treno.
                    </p>
                    <DirectionsSection propertyId={propertyId as string} />
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