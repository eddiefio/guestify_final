'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface ContactInfo {
  host_name: string
  host_phone: string
  host_email: string
  emergency_contact: string
  property_manager?: string
  property_manager_phone?: string
}

export default function ContactsPage() {
  const params = useParams()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch property details
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('name, host_name, host_phone, host_email, emergency_contact, property_manager, property_manager_phone')
          .eq('id', propertyId)

        if (propError) throw propError
        
        // Se non ci sono proprietà, mostra un errore
        if (!properties || properties.length === 0) {
          throw new Error('Property not found')
        }

        // Se ci sono più proprietà, usa la prima
        const property = properties[0]
        setPropertyName(property.name)
        setContactInfo({
          host_name: property.host_name || 'Non disponibile',
          host_phone: property.host_phone || 'Non disponibile',
          host_email: property.host_email || 'Non disponibile',
          emergency_contact: property.emergency_contact || 'Non disponibile',
          property_manager: property.property_manager,
          property_manager_phone: property.property_manager_phone
        })
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching property data:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative h-12 w-12">
              <Image 
                src="/images/logo_guest.png"
                alt="Guestify Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#5E2BFF] ml-2">Contatti</h1>
          </div>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Caricamento informazioni...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : contactInfo ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#5E2BFF]/20">
                <h2 className="text-lg font-bold text-[#5E2BFF]">Host</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                  <p className="mt-1 font-bold">{contactInfo.host_name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefono</h3>
                  <div className="mt-1 flex items-center">
                    <p className="font-bold">{contactInfo.host_phone}</p>
                    {contactInfo.host_phone !== 'Non disponibile' && (
                      <a 
                        href={`tel:${contactInfo.host_phone}`} 
                        className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <div className="mt-1 flex items-center">
                    <p className="font-bold">{contactInfo.host_email}</p>
                    {contactInfo.host_email !== 'Non disponibile' && (
                      <a 
                        href={`mailto:${contactInfo.host_email}`}
                        className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {contactInfo.property_manager && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#5E2BFF]/20">
                  <h2 className="text-lg font-bold text-[#5E2BFF]">Property Manager</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                    <p className="mt-1 font-bold">{contactInfo.property_manager}</p>
                  </div>
                  
                  {contactInfo.property_manager_phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Telefono</h3>
                      <div className="mt-1 flex items-center">
                        <p className="font-bold">{contactInfo.property_manager_phone}</p>
                        <a 
                          href={`tel:${contactInfo.property_manager_phone}`} 
                          className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#5E2BFF]/20">
                <h2 className="text-lg font-bold text-[#5E2BFF]">Emergenze</h2>
              </div>
              <div className="p-5">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Numero di emergenza</h3>
                  <div className="mt-1 flex items-center">
                    <p className="font-bold">{contactInfo.emergency_contact}</p>
                    {contactInfo.emergency_contact !== 'Non disponibile' && (
                      <a 
                        href={`tel:${contactInfo.emergency_contact}`} 
                        className="ml-3 bg-red-500 text-white p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#5E2BFF] mb-4">Contatti utili</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Polizia</h3>
                    <p className="text-sm text-gray-600">Emergenze</p>
                  </div>
                  <a href="tel:112" className="bg-[#5E2BFF]/10 text-[#5E2BFF] p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </a>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Ambulanza</h3>
                    <p className="text-sm text-gray-600">Emergenze mediche</p>
                  </div>
                  <a href="tel:118" className="bg-red-100 text-red-600 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </a>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Vigili del Fuoco</h3>
                    <p className="text-sm text-gray-600">Incendi e soccorso</p>
                  </div>
                  <a href="tel:115" className="bg-orange-100 text-orange-600 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessuna informazione di contatto disponibile</h2>
            <p className="text-gray-600">L'host non ha ancora aggiunto informazioni di contatto per questa proprietà.</p>
          </div>
        )}
      </main>

      {/* Barra di navigazione */}
      <nav className="bg-white border-t shadow-lg mt-auto">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  )
} 