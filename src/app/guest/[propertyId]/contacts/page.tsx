'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Clipboard, AlertTriangle, ShieldAlert, Siren, Flame } from 'lucide-react'

interface UsefulContactsData {
  email: string
  phoneNumber: string
  textNumber: string
  policeNumber: string
  ambulanceNumber: string
  fireNumber: string
}

interface HouseInfoItem {
  content: string
  section_type: string
}

export default function ContactsPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

        // Fetch property details
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
        const contactsItem = contactsData?.find((item: HouseInfoItem) => item.section_type === 'useful_contacts')
        
        if (contactsItem) {
          try {
            // Tenta di analizzare i dati JSON dal campo content
            const parsedData = JSON.parse(contactsItem.content)
            
            // Imposta i dati dei contatti dalla tabella house_info
            setUsefulContacts({
              email: parsedData.email || '',
              phoneNumber: parsedData.phoneNumber || '',
              textNumber: parsedData.textNumber || '',
              policeNumber: parsedData.policeNumber || '',
              ambulanceNumber: parsedData.ambulanceNumber || '',
              fireNumber: parsedData.fireNumber || ''
            })
          } catch (e) {
            console.error('Failed to parse contact data:', e)
            setUsefulContacts({
              email: '',
              phoneNumber: '',
              textNumber: '',
              policeNumber: '',
              ambulanceNumber: '',
              fireNumber: ''
            })
          }
        } else {
          // Se non ci sono dati, usa valori predefiniti
          setUsefulContacts({
            email: '',
            phoneNumber: '',
            textNumber: '',
            policeNumber: '',
            ambulanceNumber: '',
            fireNumber: ''
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
          <div className="text-gray-700 font-semibold">{propertyName}</div>
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
            {/* Useful contacts section */}
            {usefulContacts && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#5E2BFF]/20">
                  <h2 className="text-lg font-bold text-[#5E2BFF]">Useful Contacts</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Mostra la sezione solo se c'è almeno un contatto utile */}
                  {(usefulContacts.email || usefulContacts.phoneNumber || usefulContacts.textNumber) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usefulContacts.email && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Mail className="h-5 w-5 text-blue-600 mr-2" />
                            <h3 className="font-bold text-blue-800">Email</h3>
                          </div>
                          <div className="flex items-center">
                            <a href={`mailto:${usefulContacts.email}`} className="text-blue-700 font-semibold hover:underline">
                              {usefulContacts.email}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(usefulContacts.email, 'useful_email')} 
                              className="ml-2 bg-blue-100 text-blue-700 p-2 rounded-full"
                              aria-label="Copy email address"
                            >
                              <Clipboard className="h-4 w-4" />
                            </button>
                            {copiedText === 'useful_email' && (
                              <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {usefulContacts.phoneNumber && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Phone className="h-5 w-5 text-green-600 mr-2" />
                            <h3 className="font-bold text-green-800">Phone</h3>
                          </div>
                          <div className="flex items-center">
                            <a href={`tel:${usefulContacts.phoneNumber}`} className="text-green-700 font-semibold hover:underline">
                              {usefulContacts.phoneNumber}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(usefulContacts.phoneNumber, 'useful_phone')} 
                              className="ml-2 bg-green-100 text-green-700 p-2 rounded-full"
                              aria-label="Copy phone number"
                            >
                              <Clipboard className="h-4 w-4" />
                            </button>
                            {copiedText === 'useful_phone' && (
                              <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {usefulContacts.textNumber && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <h3 className="font-bold text-purple-800">Text/SMS</h3>
                          </div>
                          <div className="flex items-center">
                            <a href={`sms:${usefulContacts.textNumber}`} className="text-purple-700 font-semibold hover:underline">
                              {usefulContacts.textNumber}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(usefulContacts.textNumber, 'useful_text')} 
                              className="ml-2 bg-purple-100 text-purple-700 p-2 rounded-full"
                              aria-label="Copy text number"
                            >
                              <Clipboard className="h-4 w-4" />
                            </button>
                            {copiedText === 'useful_text' && (
                              <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-700 font-medium">No useful contacts available.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Common emergency contacts */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#5E2BFF]/20">
                <h2 className="text-lg font-bold text-[#5E2BFF]">Common Emergency Contacts</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Mostra numeri di emergenza personalizzati se presenti */}
                {usefulContacts && (usefulContacts.policeNumber || usefulContacts.ambulanceNumber || usefulContacts.fireNumber) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {usefulContacts.policeNumber && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ShieldAlert className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-bold text-blue-800">Police</h3>
                        </div>
                        <div className="flex items-center">
                          <a href={`tel:${usefulContacts.policeNumber}`} className="text-blue-700 font-semibold hover:underline">
                            {usefulContacts.policeNumber}
                          </a>
                          <button 
                            onClick={() => copyToClipboard(usefulContacts.policeNumber, 'police_custom')} 
                            className="ml-2 bg-blue-100 text-blue-700 p-2 rounded-full"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                          {copiedText === 'police_custom' && (
                            <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {usefulContacts.ambulanceNumber && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Siren className="h-5 w-5 text-red-600 mr-2" />
                          <h3 className="font-bold text-red-800">Ambulance</h3>
                        </div>
                        <div className="flex items-center">
                          <a href={`tel:${usefulContacts.ambulanceNumber}`} className="text-red-700 font-semibold hover:underline">
                            {usefulContacts.ambulanceNumber}
                          </a>
                          <button 
                            onClick={() => copyToClipboard(usefulContacts.ambulanceNumber, 'ambulance_custom')} 
                            className="ml-2 bg-red-100 text-red-700 p-2 rounded-full"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                          {copiedText === 'ambulance_custom' && (
                            <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {usefulContacts.fireNumber && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Flame className="h-5 w-5 text-orange-600 mr-2" />
                          <h3 className="font-bold text-orange-800">Fire Department</h3>
                        </div>
                        <div className="flex items-center">
                          <a href={`tel:${usefulContacts.fireNumber}`} className="text-orange-700 font-semibold hover:underline">
                            {usefulContacts.fireNumber}
                          </a>
                          <button 
                            onClick={() => copyToClipboard(usefulContacts.fireNumber, 'fire_custom')} 
                            className="ml-2 bg-orange-100 text-orange-700 p-2 rounded-full"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                          {copiedText === 'fire_custom' && (
                            <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              
                {/* Numeri di emergenza generali */}
                <div className="space-y-4 mt-4">
                  <h3 className="text-md font-bold text-gray-700 mb-2">Standard Emergency Numbers</h3>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-bold text-blue-800">Police</h3>
                      <p className="text-sm text-blue-700">Emergency</p>
                    </div>
                    <div className="flex items-center">
                      <a href="tel:112" className="bg-blue-200 text-blue-800 p-3 rounded-full mr-2">
                        <ShieldAlert className="h-6 w-6" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard("112", 'police')} 
                        className="bg-blue-100 text-blue-700 p-3 rounded-full"
                        aria-label="Copy police number"
                      >
                        <Clipboard className="h-5 w-5" />
                      </button>
                      {copiedText === 'police' && (
                        <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <h3 className="font-bold text-red-800">Ambulance</h3>
                      <p className="text-sm text-red-700">Medical emergencies</p>
                    </div>
                    <div className="flex items-center">
                      <a href="tel:118" className="bg-red-200 text-red-800 p-3 rounded-full mr-2">
                        <Siren className="h-6 w-6" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard("118", 'ambulance')} 
                        className="bg-red-100 text-red-700 p-3 rounded-full"
                        aria-label="Copy ambulance number"
                      >
                        <Clipboard className="h-5 w-5" />
                      </button>
                      {copiedText === 'ambulance' && (
                        <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <h3 className="font-bold text-orange-800">Fire Department</h3>
                      <p className="text-sm text-orange-700">Fire and rescue</p>
                    </div>
                    <div className="flex items-center">
                      <a href="tel:115" className="bg-orange-200 text-orange-800 p-3 rounded-full mr-2">
                        <Flame className="h-6 w-6" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard("115", 'fire')} 
                        className="bg-orange-100 text-orange-700 p-3 rounded-full"
                        aria-label="Copy fire department number"
                      >
                        <Clipboard className="h-5 w-5" />
                      </button>
                      {copiedText === 'fire' && (
                        <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <div>
                      <h3 className="font-bold text-emerald-800">European Emergency Number</h3>
                      <p className="text-sm text-emerald-700">All emergencies</p>
                    </div>
                    <div className="flex items-center">
                      <a href="tel:112" className="bg-emerald-200 text-emerald-800 p-3 rounded-full mr-2">
                        <AlertTriangle className="h-6 w-6" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard("112", 'eu_emergency')} 
                        className="bg-emerald-100 text-emerald-700 p-3 rounded-full"
                        aria-label="Copy European emergency number"
                      >
                        <Clipboard className="h-5 w-5" />
                      </button>
                      {copiedText === 'eu_emergency' && (
                        <span className="ml-2 text-green-600 text-sm font-semibold">Copied!</span>
                      )}
                    </div>
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