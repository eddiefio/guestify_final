'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name, host_name, host_phone, host_email, emergency_contact, property_manager, property_manager_phone')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError
        
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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#5E2BFF]">Contatti</h1>
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
              <div className="p-5 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Host</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                  <p className="mt-1">{contactInfo.host_name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefono</h3>
                  <div className="mt-1 flex items-center">
                    <p>{contactInfo.host_phone}</p>
                    {contactInfo.host_phone !== 'Non disponibile' && (
                      <a 
                        href={`tel:${contactInfo.host_phone}`} 
                        className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                      >
                        <span className="text-lg">📞</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <div className="mt-1 flex items-center">
                    <p>{contactInfo.host_email}</p>
                    {contactInfo.host_email !== 'Non disponibile' && (
                      <a 
                        href={`mailto:${contactInfo.host_email}`}
                        className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                      >
                        <span className="text-lg">✉️</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {contactInfo.property_manager && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">Property Manager</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                    <p className="mt-1">{contactInfo.property_manager}</p>
                  </div>
                  
                  {contactInfo.property_manager_phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Telefono</h3>
                      <div className="mt-1 flex items-center">
                        <p>{contactInfo.property_manager_phone}</p>
                        <a 
                          href={`tel:${contactInfo.property_manager_phone}`} 
                          className="ml-3 bg-[#5E2BFF] text-white p-2 rounded-full"
                        >
                          <span className="text-lg">📞</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Emergenze</h2>
              </div>
              <div className="p-5">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Numero di emergenza</h3>
                  <div className="mt-1 flex items-center">
                    <p>{contactInfo.emergency_contact}</p>
                    {contactInfo.emergency_contact !== 'Non disponibile' && (
                      <a 
                        href={`tel:${contactInfo.emergency_contact}`} 
                        className="ml-3 bg-red-500 text-white p-2 rounded-full"
                      >
                        <span className="text-lg">🚨</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contatti utili</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Polizia</h3>
                    <p className="text-sm text-gray-600">Emergenze</p>
                  </div>
                  <a href="tel:112" className="bg-blue-100 text-blue-800 p-3 rounded-full">
                    <span className="text-lg">👮</span>
                  </a>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Ambulanza</h3>
                    <p className="text-sm text-gray-600">Emergenze mediche</p>
                  </div>
                  <a href="tel:118" className="bg-red-100 text-red-800 p-3 rounded-full">
                    <span className="text-lg">🚑</span>
                  </a>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Vigili del Fuoco</h3>
                    <p className="text-sm text-gray-600">Incendi e soccorso</p>
                  </div>
                  <a href="tel:115" className="bg-orange-100 text-orange-800 p-3 rounded-full">
                    <span className="text-lg">🚒</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">
              <div className="text-5xl mb-4">🔍</div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Nessuna informazione di contatto disponibile</h2>
            <p className="text-gray-600">L'host non ha ancora aggiunto informazioni di contatto per questa proprietà.</p>
          </div>
        )}
      </main>

      {/* Barra di navigazione */}
      <nav className="bg-white border-t shadow-lg mt-auto">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">📞</div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">🏠</div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-2xl">🗺️</div>
          </Link>
        </div>
      </nav>
    </div>
  )
} 