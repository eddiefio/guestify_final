'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Tipi per le diverse sezioni
interface HouseRule {
  id: string
  title: string
  description?: string
  active: boolean
}

interface WifiCredential {
  id: string
  network_name: string
  password: string
}

interface HowThingsWorkItem {
  id: string
  title: string
  description?: string
  file_path: string
}

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

export default function HouseInfo() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [houseRules, setHouseRules] = useState<HouseRule[]>([])
  const [wifiCredentials, setWifiCredentials] = useState<WifiCredential | null>(null)
  const [howThingsWork, setHowThingsWork] = useState<HowThingsWorkItem[]>([])
  const [houseInfoSections, setHouseInfoSections] = useState<{[key: string]: HouseInfoItem | null}>({
    checkin_information: null,
    before_you_leave: null,
    checkout_information: null,
    useful_contacts: null,
    book_again: null
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('house-rules')
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  // Carica i dati della proprietà e tutte le informazioni correlate
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
        
        // Carica le regole della casa
        const { data: rulesData, error: rulesError } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (rulesError) throw rulesError
        setHouseRules(rulesData || [])
        
        // Carica le credenziali WiFi
        const { data: wifiData, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        // È normale che non ci siano credenziali WiFi, quindi non lanciamo errori
        setWifiCredentials(wifiData || null)
        
        // Carica le istruzioni "How Things Work"
        const { data: howThingsData, error: howThingsError } = await supabase
          .from('how_things_work')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (howThingsError) throw howThingsError
        setHowThingsWork(howThingsData || [])
        
        // Carica le altre sezioni di house_info
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .in('section_type', [
            'checkin_information', 
            'before_you_leave', 
            'checkout_information', 
            'useful_contacts', 
            'book_again'
          ])
        
        if (sectionsError) throw sectionsError
        
        // Organizza i dati per sezione
        const sectionsMap = { ...houseInfoSections }
        
        if (sectionsData) {
          sectionsData.forEach((section: HouseInfoItem) => {
            sectionsMap[section.section_type] = section
          })
        }
        
        setHouseInfoSections(sectionsMap)
        
      } catch (error) {
        console.error('Error fetching property data:', error)
        toast.error('Failed to load property information')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId, user, router])

  // Funzione per cambiare tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setIsEditing(null)
  }

  // Funzione per salvare il contenuto di una sezione
  const handleSaveSection = async (sectionType: string) => {
    try {
      const currentSection = houseInfoSections[sectionType]
      
      if (currentSection) {
        // Aggiorna la sezione esistente
        const { error } = await supabase
          .from('house_info')
          .update({ 
            content: editContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSection.id)
        
        if (error) throw error
      } else {
        // Crea una nuova sezione
        const { error } = await supabase
          .from('house_info')
          .insert({
            property_id: propertyId,
            section_type: sectionType,
            content: editContent
          })
        
        if (error) throw error
        
        // Aggiorna lo state con i nuovi dati
        const { data, error: fetchError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', sectionType)
          .single()
        
        if (fetchError) throw fetchError
        
        setHouseInfoSections(prev => ({
          ...prev,
          [sectionType]: data
        }))
      }
      
      toast.success('Information saved successfully')
      setIsEditing(null)
    } catch (error) {
      console.error('Error saving section:', error)
      toast.error('Failed to save information')
    }
  }

  // Funzione per modificare una sezione
  const handleEditSection = (sectionType: string) => {
    const section = houseInfoSections[sectionType]
    setEditContent(section?.content || '')
    setIsEditing(sectionType)
  }

  // Titoli human-friendly per le sezioni
  const sectionTitles: { [key: string]: string } = {
    'checkin_information': 'Check-in Information',
    'before_you_leave': 'Before You Leave Home',
    'checkout_information': 'Check-out Information',
    'useful_contacts': 'Useful Contacts',
    'book_again': 'Book Again',
    'house_rules': 'House Rules',
    'wifi_connection': 'WiFi Connection',
    'how_things_work': 'How Things Work'
  }

  // Icone per le sezioni
  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'checkin_information':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
        )
      case 'before_you_leave':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
        )
      case 'checkout_information':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        )
      case 'useful_contacts':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
        )
      case 'book_again':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
    }
  }

  // Colori per le sezioni
  const getSectionColor = (sectionType: string) => {
    switch (sectionType) {
      case 'checkin_information':
        return 'bg-emerald-500'
      case 'before_you_leave':
        return 'bg-amber-500'
      case 'checkout_information': 
        return 'bg-rose-500'
      case 'useful_contacts':
        return 'bg-sky-500'
      case 'book_again':
        return 'bg-violet-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Funzione che renderizza una sezione
  const renderInfoSection = (sectionType: string) => {
    const section = houseInfoSections[sectionType]
    
    if (isEditing === sectionType) {
      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{sectionTitles[sectionType]}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSaveSection(sectionType)}
                className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg> Save
              </button>
              <button 
                onClick={() => setIsEditing(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
            placeholder={`Add your ${sectionTitles[sectionType]} details here...`}
          />
        </div>
      )
    }
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{sectionTitles[sectionType]}</h2>
          <button 
            onClick={() => handleEditSection(sectionType)}
            className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg> {section ? 'Edit' : 'Add'}
          </button>
        </div>

        {!section ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">No {sectionTitles[sectionType]} information has been added yet.</p>
            <button 
              onClick={() => handleEditSection(sectionType)}
              className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold"
            >
              Add Information
            </button>
          </div>
        ) : (
          <div className={`rounded-lg p-6 bg-${sectionType === 'book_again' ? 'purple' : 'gray'}-50`}>
            <div className="prose max-w-none">
              {section.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <Layout title={`House Info - ${property?.name || 'Property'}`}>
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
              <span className="font-medium">House Info</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              House Info for {property?.name || 'Loading...'}
            </h1>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading house information...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Tab navigation - ora con tabs scorrevoli su mobile */}
              <div className="overflow-x-auto border-b">
                <div className="flex whitespace-nowrap min-w-max">
                  {/* Tab originali */}
                  <button
                    onClick={() => handleTabChange('house-rules')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'house-rules'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    House Rules
                  </button>
                  <button
                    onClick={() => handleTabChange('wifi-connection')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'wifi-connection'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                    </svg>
                    WiFi
                  </button>
                  <button
                    onClick={() => handleTabChange('how-things-work')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'how-things-work'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    How Things Work
                  </button>
                  
                  {/* Nuove tabs */}
                  <button
                    onClick={() => handleTabChange('checkin_information')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'checkin_information'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getSectionIcon('checkin_information')}
                    <span className="ml-1.5">Check-in</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('before_you_leave')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'before_you_leave'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getSectionIcon('before_you_leave')}
                    <span className="ml-1.5">Before Leaving</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('checkout_information')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'checkout_information'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getSectionIcon('checkout_information')}
                    <span className="ml-1.5">Check-out</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('useful_contacts')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'useful_contacts'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getSectionIcon('useful_contacts')}
                    <span className="ml-1.5">Contacts</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('book_again')}
                    className={`px-6 py-3 text-sm md:text-base font-bold flex items-center ${
                      activeTab === 'book_again'
                        ? 'border-b-2 border-[#5E2BFF] text-[#5E2BFF]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getSectionIcon('book_again')}
                    <span className="ml-1.5">Book Again</span>
                  </button>
                </div>
              </div>

              {/* Navigazione secondaria come interfaccia a griglia, per mobile */}
              <div className="lg:hidden p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-2">
                  {['house-rules', 'wifi-connection', 'how-things-work', 'checkin_information', 'before_you_leave', 'checkout_information', 'useful_contacts', 'book_again'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`p-2 text-xs text-center rounded-lg ${
                        activeTab === tab
                          ? 'bg-[#5E2BFF] text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {tab === 'house-rules' && 'Rules'}
                      {tab === 'wifi-connection' && 'WiFi'}
                      {tab === 'how-things-work' && 'Guides'}
                      {tab === 'checkin_information' && 'Check-in'}
                      {tab === 'before_you_leave' && 'Before Leaving'}
                      {tab === 'checkout_information' && 'Check-out'}
                      {tab === 'useful_contacts' && 'Contacts'}
                      {tab === 'book_again' && 'Book Again'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {/* House Rules Tab */}
                {activeTab === 'house-rules' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">House Rules</h2>
                      <Link href={`/dashboard/property/${propertyId}/house-rules`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg> Manage Rules
                        </button>
                      </Link>
                    </div>

                    {houseRules.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No house rules have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/house-rules`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Add House Rules
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {houseRules.map((rule) => (
                          <div key={rule.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                            <h3 className="font-bold text-lg text-gray-800">{rule.title}</h3>
                            {rule.description && (
                              <p className="text-gray-600 mt-2">{rule.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* WiFi Connection Tab */}
                {activeTab === 'wifi-connection' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">WiFi Connection</h2>
                      <Link href={`/dashboard/property/${propertyId}/wifi-connection`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          {wifiCredentials ? 'Edit WiFi' : 'Set Up WiFi'}
                        </button>
                      </Link>
                    </div>

                    {!wifiCredentials ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No WiFi credentials have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/wifi-connection`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Set Up WiFi
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-6">
                        <div className="mb-4">
                          <h3 className="text-sm text-gray-500 font-medium">Network Name</h3>
                          <p className="text-lg font-bold">{wifiCredentials.network_name}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm text-gray-500 font-medium">Password</h3>
                          <p className="text-lg font-bold">{wifiCredentials.password}</p>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Guests will be able to connect to your WiFi by scanning the QR code.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* How Things Work Tab */}
                {activeTab === 'how-things-work' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">How Things Work</h2>
                      <Link href={`/dashboard/property/${propertyId}/how-things-work`}>
                        <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg> Manage Guides
                        </button>
                      </Link>
                    </div>

                    {howThingsWork.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No guides have been added yet.</p>
                        <Link href={`/dashboard/property/${propertyId}/how-things-work`}>
                          <button className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4a22cd] transition font-bold">
                            Add Guides
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {howThingsWork.map((item) => (
                          <div key={item.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                            <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                            {item.description && (
                              <p className="text-gray-600 mt-2">{item.description}</p>
                            )}
                            <div className="mt-3">
                              <a 
                                href={item.file_path} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#5E2BFF] font-bold hover:underline flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                View Guide
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Nuove sezioni */}
                {activeTab === 'checkin_information' && renderInfoSection('checkin_information')}
                {activeTab === 'before_you_leave' && renderInfoSection('before_you_leave')}
                {activeTab === 'checkout_information' && renderInfoSection('checkout_information')}
                {activeTab === 'useful_contacts' && renderInfoSection('useful_contacts')}
                {activeTab === 'book_again' && renderInfoSection('book_again')}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 