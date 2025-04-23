'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Clipboard, AlertTriangle, Stethoscope } from 'lucide-react'

interface ContactInfo {
  host_name: string
  host_phone: string
  host_email: string
  emergency_contact: string
  property_manager?: string
  property_manager_phone?: string
}

interface UsefulContactsData {
  email: string
  phoneNumber: string
  textNumber: string
  medicalInfo: string
}

export default function ContactsPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [usefulContacts, setUsefulContacts] = useState<UsefulContactsData | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Fetch property details - solo le colonne che esistono nella tabella
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)

        if (propError) throw propError
        
        // Se non ci sono proprietà, mostra un errore
        if (!properties || properties.length === 0) {
          throw new Error('Property not found')
        }

        // Se ci sono più proprietà, usa la prima
        const property = properties[0]
        setPropertyName(property.name)
        
        // Fetch contacts data from house_info
        const { data: contactsData, error: contactsError } = await supabase
          .from('house_info')
          .select('content, section_type')
          .eq('property_id', propertyId)
          .in('section_type', ['useful_contacts'])
        
        if (contactsError) {
          console.error('Error fetching contacts:', contactsError)
          throw contactsError
        }
        
        // Cerca i dati dei contatti nei risultati
        const contactsItem = contactsData?.find(item => item.section_type === 'useful_contacts')
        
        if (contactsItem) {
          try {
            // Tenta di analizzare i dati JSON dal campo content
            const parsedData = JSON.parse(contactsItem.content)
            
            // Imposta i dati di contatto dalla tabella house_info
            setContactInfo({
              host_name: parsedData.host_name || 'Not available',
              host_phone: parsedData.host_phone || 'Not available',
              host_email: parsedData.host_email || 'Not available',
              emergency_contact: parsedData.emergency_contact || 'Not available',
              property_manager: parsedData.property_manager,
              property_manager_phone: parsedData.property_manager_phone
            })
            
            setUsefulContacts({
              email: parsedData.email || '',
              phoneNumber: parsedData.phoneNumber || '',
              textNumber: parsedData.textNumber || '',
              medicalInfo: parsedData.medicalInfo || ''
            })
          } catch (e) {
            console.error('Failed to parse contact data:', e)
            setContactInfo({
              host_name: 'Not available',
              host_phone: 'Not available',
              host_email: 'Not available',
              emergency_contact: 'Not available',
              property_manager: undefined,
              property_manager_phone: undefined
            })
          }
        } else {
          // Se non ci sono dati, usa valori predefiniti
          setContactInfo({
            host_name: 'Not available',
            host_phone: 'Not available',
            host_email: 'Not available',
            emergency_contact: 'Not available',
            property_manager: undefined,
            property_manager_phone: undefined
          })
        }
        
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
            <button 
              onClick={() => router.push(`/guest/${propertyId}`)}
              className="p-2 mr-2 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#5E2BFF]">Useful Contacts</h1>
          </div>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading contacts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Host section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#5E2BFF]/20">
                <h2 className="text-lg font-bold text-[#5E2BFF]">Host</h2>
              </div>
              <div className="p-5 space-y-4">
                {contactInfo && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="mt-1 font-bold">{contactInfo.host_name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <div className="mt-1 flex items-center">
                        <p className="font-bold">{contactInfo.host_phone}</p>
                        {contactInfo.host_phone !== 'Not available' && (
                          <div className="flex ml-3">
                            <a 
                              href={`tel:${contactInfo.host_phone}`} 
                              className="bg-[#5E2BFF] text-white p-2 rounded-full mr-2"
                            >
                              <Phone className="h-5 w-5" />
                            </a>
                            <button 
                              onClick={() => copyToClipboard(contactInfo.host_phone, 'host_phone')} 
                              className="bg-gray-100 text-gray-700 p-2 rounded-full"
                              aria-label="Copy phone number"
                            >
                              <Clipboard className="h-5 w-5" />
                            </button>
                            {copiedText === 'host_phone' && (
                              <span className="ml-2 text-green-600 text-sm self-center">Copied!</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <div className="mt-1 flex items-center">
                        <p className="font-bold">{contactInfo.host_email}</p>
                        {contactInfo.host_email !== 'Not available' && (
                          <div className="flex ml-3">
                            <a 
                              href={`mailto:${contactInfo.host_email}`}
                              className="bg-[#5E2BFF] text-white p-2 rounded-full mr-2"
                            >
                              <Mail className="h-5 w-5" />
                            </a>
                            <button 
                              onClick={() => copyToClipboard(contactInfo.host_email, 'host_email')} 
                              className="bg-gray-100 text-gray-700 p-2 rounded-full"
                              aria-label="Copy email address"
                            >
                              <Clipboard className="h-5 w-5" />
                            </button>
                            {copiedText === 'host_email' && (
                              <span className="ml-2 text-green-600 text-sm self-center">Copied!</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Property Manager section */}
            {contactInfo && contactInfo.property_manager && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#5E2BFF]/20">
                  <h2 className="text-lg font-bold text-[#5E2BFF]">Property Manager</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 font-bold">{contactInfo.property_manager}</p>
                  </div>
                  
                  {contactInfo.property_manager_phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <div className="mt-1 flex items-center">
                        <p className="font-bold">{contactInfo.property_manager_phone}</p>
                        <div className="flex ml-3">
                          <a 
                            href={`tel:${contactInfo.property_manager_phone}`} 
                            className="bg-[#5E2BFF] text-white p-2 rounded-full mr-2"
                          >
                            <Phone className="h-5 w-5" />
                          </a>
                          <button 
                            onClick={() => copyToClipboard(contactInfo.property_manager_phone ?? '', 'manager_phone')} 
                            className="bg-gray-100 text-gray-700 p-2 rounded-full"
                            aria-label="Copy phone number"
                          >
                            <Clipboard className="h-5 w-5" />
                          </button>
                          {copiedText === 'manager_phone' && (
                            <span className="ml-2 text-green-600 text-sm self-center">Copied!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Emergency section */}
            {contactInfo && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#5E2BFF]/20">
                  <h2 className="text-lg font-bold text-[#5E2BFF]">Emergency</h2>
                </div>
                <div className="p-5">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Emergency number</h3>
                    <div className="mt-1 flex items-center">
                      <p className="font-bold">{contactInfo.emergency_contact}</p>
                      {contactInfo.emergency_contact !== 'Not available' && (
                        <div className="flex ml-3">
                          <a 
                            href={`tel:${contactInfo.emergency_contact}`} 
                            className="bg-red-500 text-white p-2 rounded-full mr-2"
                          >
                            <AlertTriangle className="h-5 w-5" />
                          </a>
                          <button 
                            onClick={() => copyToClipboard(contactInfo.emergency_contact, 'emergency')} 
                            className="bg-gray-100 text-gray-700 p-2 rounded-full"
                            aria-label="Copy emergency number"
                          >
                            <Clipboard className="h-5 w-5" />
                          </button>
                          {copiedText === 'emergency' && (
                            <span className="ml-2 text-green-600 text-sm self-center">Copied!</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Useful contacts section with data from house_info */}
            {usefulContacts && (Object.values(usefulContacts).some(value => value !== '')) && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#5E2BFF]/20">
                  <h2 className="text-lg font-bold text-[#5E2BFF]">Additional Useful Contacts</h2>
                </div>
                <div className="p-5 space-y-4">
                  {usefulContacts.email && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Mail className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-bold text-gray-800">Email</h3>
                      </div>
                      <div className="flex items-center">
                        <a href={`mailto:${usefulContacts.email}`} className="text-blue-600 hover:underline">
                          {usefulContacts.email}
                        </a>
                        <button 
                          onClick={() => copyToClipboard(usefulContacts.email, 'useful_email')} 
                          className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-full"
                          aria-label="Copy email address"
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                        {copiedText === 'useful_email' && (
                          <span className="ml-2 text-green-600 text-sm">Copied!</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {usefulContacts.phoneNumber && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Phone className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-bold text-gray-800">Phone</h3>
                      </div>
                      <div className="flex items-center">
                        <a href={`tel:${usefulContacts.phoneNumber}`} className="text-green-600 hover:underline">
                          {usefulContacts.phoneNumber}
                        </a>
                        <button 
                          onClick={() => copyToClipboard(usefulContacts.phoneNumber, 'useful_phone')} 
                          className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-full"
                          aria-label="Copy phone number"
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                        {copiedText === 'useful_phone' && (
                          <span className="ml-2 text-green-600 text-sm">Copied!</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {usefulContacts.textNumber && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h3 className="font-bold text-gray-800">Text/SMS</h3>
                      </div>
                      <div className="flex items-center">
                        <a href={`sms:${usefulContacts.textNumber}`} className="text-indigo-600 hover:underline">
                          {usefulContacts.textNumber}
                        </a>
                        <button 
                          onClick={() => copyToClipboard(usefulContacts.textNumber, 'useful_text')} 
                          className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-full"
                          aria-label="Copy text number"
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                        {copiedText === 'useful_text' && (
                          <span className="ml-2 text-green-600 text-sm">Copied!</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {usefulContacts.medicalInfo && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Stethoscope className="h-5 w-5 text-red-600 mr-2" />
                        <h3 className="font-bold text-gray-800">Medical Info</h3>
                      </div>
                      <div className="flex items-center">
                        <p className="text-red-700">{usefulContacts.medicalInfo}</p>
                        <button 
                          onClick={() => copyToClipboard(usefulContacts.medicalInfo, 'useful_medical')} 
                          className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-full"
                          aria-label="Copy medical info"
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                        {copiedText === 'useful_medical' && (
                          <span className="ml-2 text-green-600 text-sm">Copied!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Common emergency contacts */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#5E2BFF] mb-4">Common Emergency Contacts</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Police</h3>
                    <p className="text-sm text-gray-600">Emergency</p>
                  </div>
                  <div className="flex items-center">
                    <a href="tel:112" className="bg-[#5E2BFF]/10 text-[#5E2BFF] p-3 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </a>
                    <button 
                      onClick={() => copyToClipboard("112", 'police')} 
                      className="bg-gray-100 text-gray-700 p-3 rounded-full"
                      aria-label="Copy police number"
                    >
                      <Clipboard className="h-6 w-6" />
                    </button>
                    {copiedText === 'police' && (
                      <span className="ml-2 text-green-600 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Ambulance</h3>
                    <p className="text-sm text-gray-600">Medical emergencies</p>
                  </div>
                  <div className="flex items-center">
                    <a href="tel:118" className="bg-red-100 text-red-600 p-3 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </a>
                    <button 
                      onClick={() => copyToClipboard("118", 'ambulance')} 
                      className="bg-gray-100 text-gray-700 p-3 rounded-full"
                      aria-label="Copy ambulance number"
                    >
                      <Clipboard className="h-6 w-6" />
                    </button>
                    {copiedText === 'ambulance' && (
                      <span className="ml-2 text-green-600 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Fire Department</h3>
                    <p className="text-sm text-gray-600">Fire and rescue</p>
                  </div>
                  <div className="flex items-center">
                    <a href="tel:115" className="bg-orange-100 text-orange-600 p-3 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                    </a>
                    <button 
                      onClick={() => copyToClipboard("115", 'fire')} 
                      className="bg-gray-100 text-gray-700 p-3 rounded-full"
                      aria-label="Copy fire department number"
                    >
                      <Clipboard className="h-6 w-6" />
                    </button>
                    {copiedText === 'fire' && (
                      <span className="ml-2 text-green-600 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">European Emergency Number</h3>
                    <p className="text-sm text-gray-600">All emergencies</p>
                  </div>
                  <div className="flex items-center">
                    <a href="tel:112" className="bg-blue-100 text-blue-600 p-3 rounded-full mr-2">
                      <AlertTriangle className="h-6 w-6" />
                    </a>
                    <button 
                      onClick={() => copyToClipboard("112", 'eu_emergency')} 
                      className="bg-gray-100 text-gray-700 p-3 rounded-full"
                      aria-label="Copy European emergency number"
                    >
                      <Clipboard className="h-6 w-6" />
                    </button>
                    {copiedText === 'eu_emergency' && (
                      <span className="ml-2 text-green-600 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 