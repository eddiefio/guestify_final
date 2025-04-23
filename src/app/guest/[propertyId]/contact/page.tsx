'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Contact {
  id: string
  property_id: string
  name: string
  relationship: string
  phone: string
  email: string | null
  notes: string | null
  is_primary: boolean
  created_at: string
}

export default function ContactGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (!propertyId) return

    const fetchContacts = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        setPropertyName(propertyData.name)
        
        // Fetch contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('property_id', propertyId)
          .order('is_primary', { ascending: false })
        
        if (contactsError) throw contactsError
        
        setContacts(contactsData || [])
        
      } catch (error) {
        console.error('Error fetching contacts:', error)
        setError('Could not load contact information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContacts()
  }, [propertyId])

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push(`/guest/${propertyId}`)}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Contact Information</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading contact information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Contact Information Not Available</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => router.push(`/guest/${propertyId}`)}
                className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Property name */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                Important contacts for your stay
              </p>
            </div>

            {contacts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Contact Information</h3>
                <p className="text-gray-600">
                  The host has not added any contact information yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className={`${contact.is_primary ? 'bg-[#5E2BFF]' : 'bg-gray-600'} p-4`}>
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">
                          {contact.is_primary ? 'Primary Contact' : 'Additional Contact'}
                        </span>
                        {contact.is_primary && (
                          <span className="bg-[#ffde59] text-[#5E2BFF] text-xs font-bold py-1 px-2 rounded">
                            HOST
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                          <p className="text-gray-600 text-sm">{contact.relationship}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        {/* Phone number */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-gray-700">{contact.phone}</span>
                          </div>
                          <button
                            onClick={() => handleCall(contact.phone)}
                            className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600"
                            aria-label="Call"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Email - if available */}
                        {contact.email && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-700 truncate max-w-[180px]">{contact.email}</span>
                            </div>
                            <button
                              onClick={() => handleEmail(contact.email!)}
                              className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
                              aria-label="Email"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Notes - if available */}
                      {contact.notes && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Notes</div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap text-sm">{contact.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      For urgent matters, please contact the primary contact. Response times may vary.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-8">
              <Link href={`/guest/${propertyId}`} className="text-[#5E2BFF] hover:underline">
                Back to All Services
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 