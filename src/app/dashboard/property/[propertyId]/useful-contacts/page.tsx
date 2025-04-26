'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Phone, Mail, PenLine, ShieldAlert, Siren, Flame } from 'lucide-react'

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

interface UsefulContact {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface UsefulContactsData {
  email: string
  phoneNumber: string
  textNumber: string
  policeNumber: string
  ambulanceNumber: string
  fireNumber: string
}

export default function UsefulContacts() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [usefulContact, setUsefulContact] = useState<UsefulContact | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<UsefulContactsData>({
    email: '',
    phoneNumber: '',
    textNumber: '',
    policeNumber: '',
    ambulanceNumber: '',
    fireNumber: ''
  })
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
        
        // Carica i contatti utili
        const { data: contactData, error: contactError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'useful_contacts')
          .single()
        
        if (contactError && contactError.code !== 'PGRST116') { // PGRST116 è l'errore quando non viene trovato nulla
          throw contactError
        }
        
        if (contactData) {
          setUsefulContact(contactData)
          
          try {
            // Tenta di analizzare i dati JSON dal campo content
            const parsedData = JSON.parse(contactData.content)
            setFormData({
              email: parsedData.email || '',
              phoneNumber: parsedData.phoneNumber || '',
              textNumber: parsedData.textNumber || '',
              policeNumber: parsedData.policeNumber || '',
              ambulanceNumber: parsedData.ambulanceNumber || '',
              fireNumber: parsedData.fireNumber || ''
            })
          } catch (e) {
            // Se il parsing fallisce, potrebbe essere che il campo non è in formato JSON
            console.error('Failed to parse contact data:', e)
            setFormData({
              email: '',
              phoneNumber: '',
              textNumber: '',
              policeNumber: '',
              ambulanceNumber: '',
              fireNumber: ''
            })
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      const contactContent = JSON.stringify(formData)
      
      if (usefulContact) {
        // Aggiorna il record esistente
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: contactContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', usefulContact.id)
        
        if (error) throw error
      } else {
        // Crea un nuovo record
        const { error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: 'useful_contacts',
            content: contactContent
          })
        
        if (error) throw error
        
        // Aggiorna lo state con i nuovi dati
        const { data, error: fetchError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'useful_contacts')
          .single()
        
        if (fetchError) throw fetchError
        
        setUsefulContact(data)
      }
      
      setIsEditing(false)
      toast.success('Useful contacts saved successfully')
    } catch (error) {
      console.error('Error saving contacts:', error)
      toast.error('Failed to save useful contacts')
    }
  }

  return (
    <ProtectedRoute>
      <Layout title={`Useful Contacts - ${property?.name || 'Property'}`} hasBackButton backUrl="/dashboard">
        <div className="container mx-auto px-4 py-6 font-spartan">
          {/* Header con breadcrumb e nome proprietà */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="font-medium">Useful Contacts</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Useful Contacts for {property?.name || 'Loading...'}
            </h1>
            <p className="text-gray-600 mt-1">Manage contact information for your guests</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading useful contacts...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold flex items-center"
                  >
                    <PenLine className="w-4 h-4 mr-2" /> 
                    {usefulContact ? 'Edit' : 'Add'} Contacts
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Telephone Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter your telephone number"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="textNumber" className="block text-sm font-medium text-gray-700 mb-1">Text Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="textNumber"
                            name="textNumber"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter your text/SMS number"
                            value={formData.textNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Common Emergency Contacts</h3>
                      <div>
                        <label htmlFor="policeNumber" className="block text-sm font-medium text-gray-700 mb-1">Police Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ShieldAlert className="h-5 w-5 text-blue-500" />
                          </div>
                          <input
                            type="tel"
                            id="policeNumber"
                            name="policeNumber"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter police emergency number"
                            value={formData.policeNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="ambulanceNumber" className="block text-sm font-medium text-gray-700 mb-1">Ambulance Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Siren className="h-5 w-5 text-red-500" />
                          </div>
                          <input
                            type="tel"
                            id="ambulanceNumber"
                            name="ambulanceNumber"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter ambulance emergency number"
                            value={formData.ambulanceNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="fireNumber" className="block text-sm font-medium text-gray-700 mb-1">Fire Department Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Flame className="h-5 w-5 text-orange-500" />
                          </div>
                          <input
                            type="tel"
                            id="fireNumber"
                            name="fireNumber"
                            className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-[#5E2BFF] focus:border-[#5E2BFF] p-3"
                            placeholder="Enter fire department number"
                            value={formData.fireNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2 bg-[#5E2BFF] text-white rounded-lg font-bold hover:bg-[#4a22cd] transition"
                    >
                      Save Contacts
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {!usefulContact ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Phone className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-4">No contact information has been added yet.</p>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-[#5E2BFF] text-white px-6 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
                      >
                        Add Contact Information
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {formData.email && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Mail className="h-5 w-5 text-blue-600 mr-2" />
                              <h3 className="font-bold text-gray-800">Email</h3>
                            </div>
                            <a href={`mailto:${formData.email}`} className="text-blue-600 hover:underline">
                              {formData.email}
                            </a>
                          </div>
                        )}
                        
                        {formData.phoneNumber && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Phone className="h-5 w-5 text-green-600 mr-2" />
                              <h3 className="font-bold text-gray-800">Telephone</h3>
                            </div>
                            <a href={`tel:${formData.phoneNumber}`} className="text-green-600 hover:underline">
                              {formData.phoneNumber}
                            </a>
                          </div>
                        )}
                        
                        {formData.textNumber && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Phone className="h-5 w-5 text-purple-600 mr-2" />
                              <h3 className="font-bold text-gray-800">Text/SMS</h3>
                            </div>
                            <a href={`sms:${formData.textNumber}`} className="text-purple-600 hover:underline">
                              {formData.textNumber}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {(formData.policeNumber || formData.ambulanceNumber || formData.fireNumber) && (
                        <div className="mt-8">
                          <div className="flex items-center mb-4">
                            <ShieldAlert className="h-6 w-6 text-blue-600 mr-2" />
                            <h3 className="text-lg font-bold text-gray-800">Common Emergency Contacts</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {formData.policeNumber && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <ShieldAlert className="h-5 w-5 text-blue-600 mr-2" />
                                  <h3 className="font-bold text-gray-800">Police</h3>
                                </div>
                                <a href={`tel:${formData.policeNumber}`} className="text-blue-600 hover:underline">
                                  {formData.policeNumber}
                                </a>
                              </div>
                            )}
                            
                            {formData.ambulanceNumber && (
                              <div className="bg-red-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <Siren className="h-5 w-5 text-red-600 mr-2" />
                                  <h3 className="font-bold text-gray-800">Ambulance</h3>
                                </div>
                                <a href={`tel:${formData.ambulanceNumber}`} className="text-red-600 hover:underline">
                                  {formData.ambulanceNumber}
                                </a>
                              </div>
                            )}
                            
                            {formData.fireNumber && (
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <Flame className="h-5 w-5 text-orange-600 mr-2" />
                                  <h3 className="font-bold text-gray-800">Fire Department</h3>
                                </div>
                                <a href={`tel:${formData.fireNumber}`} className="text-orange-600 hover:underline">
                                  {formData.fireNumber}
                                </a>
                              </div>
                            )}
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