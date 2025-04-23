"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { ChevronLeftIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
  checkout_time: string
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

interface CheckoutInstruction {
  id: string
  property_id: string
  title: string
  description: string
  order?: number
  is_required: boolean
}

export default function BeforeLeaving({ params }: { params: { propertyId: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const propertyId = params.propertyId
  
  const [activeTab, setActiveTab] = useState<'whats-provided' | 'info-needed' | 'how-to-get'>('whats-provided')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [providedCategories, setProvidedCategories] = useState<ProvidedCategory[]>([])
  const [infoNeeded, setInfoNeeded] = useState<string>('')
  const [directions, setDirections] = useState<DirectionPhoto[]>([])
  const [instructions, setInstructions] = useState<CheckoutInstruction[]>([])
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    lights: false,
    windows: false,
    appliances: false,
    trash: false,
    keys: false,
    belongings: false
  })

  const handleCheck = (item: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const allChecked = Object.values(checklist).every(value => value)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('id, name, checkout_time')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw new Error('Impossibile caricare i dettagli della proprietà')
        
        setProperty(propertyData)
        
        // Fetch provided categories and items
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('provided_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (categoriesError) throw categoriesError
        
        const categoriesWithItems: ProvidedCategory[] = []
        
        if (categoriesData && categoriesData.length > 0) {
          for (const category of categoriesData) {
            const { data: itemsData, error: itemsError } = await supabase
              .from('provided_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            
            categoriesWithItems.push({
              ...category,
              items: itemsData || []
            })
          }
        }
        
        setProvidedCategories(categoriesWithItems)
        
        // Fetch info needed
        const { data: infoData, error: infoError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)
          .eq('section_type', 'info_needed')
          .single()
        
        if (infoData) {
          setInfoNeeded(infoData.content)
        } else if (infoError && infoError.code !== 'PGRST116') { // PGRST116 is when no rows returned
          throw infoError
        }
        
        // Fetch direction photos
        const { data: directionsData, error: directionsError } = await supabase
          .from('direction_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (directionsError) throw directionsError
        
        setDirections(directionsData || [])
        
        // Fetch checkout instructions
        const { data: instructionsData, error: instructionsError } = await supabase
          .from('checkout_instructions')
          .select('*')
          .eq('property_id', propertyId)
          .order('order')
        
        if (instructionsError) throw instructionsError
        
        setInstructions(instructionsData || [])
        
        // Initialize completion state
        const initialCompletionState: Record<string, boolean> = {}
        instructionsData?.forEach((instruction: CheckoutInstruction) => {
          initialCompletionState[instruction.id] = false
        })
        setCompleted(initialCompletionState)
        
        setError(null)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Si è verificato un errore imprevisto')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [propertyId, supabase])

  const toggleCompleted = (id: string) => {
    setCompleted(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const allRequiredCompleted = () => {
    return instructions
      .filter(instruction => instruction.is_required)
      .every(instruction => completed[instruction.id])
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-2 rounded-full p-1 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Prima di partire</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#5E2BFF] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-gray-600">Caricamento...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-bold text-red-800">Si è verificato un errore</h2>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <div>
            {/* Property Info */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-800">{property?.name}</h2>
              <div className="mt-3 flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Orario di checkout: <span className="font-medium">{property?.checkout_time || "Non specificato"}</span></p>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'whats-provided' ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                onClick={() => setActiveTab('whats-provided')}
              >
                <div className="text-blue-500 mb-1 md:mb-2">
                  <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">What's Provided</h2>
              </div>

              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'info-needed' ? 'bg-yellow-100' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                onClick={() => setActiveTab('info-needed')}
              >
                <div className="text-yellow-500 mb-1 md:mb-2">
                  <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">Info We Need</h2>
              </div>

              <div 
                className={`rounded-xl shadow hover:shadow-md transition p-2 md:p-6 cursor-pointer h-full flex flex-col items-center justify-center ${activeTab === 'how-to-get' ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'}`}
                onClick={() => setActiveTab('how-to-get')}
              >
                <div className="text-green-500 mb-1 md:mb-2">
                  <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                <h2 className="text-xs md:text-xl font-bold text-gray-800 text-center">How To Get There</h2>
              </div>
            </div>

            {/* Content based on active tab */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              {activeTab === 'whats-provided' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">What's Provided at Your Stay</h2>
                  
                  {providedCategories.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600">No information available about provided items.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {providedCategories.map(category => (
                        <div key={category.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <h3 className="text-lg font-bold text-gray-800 mb-3">{category.name}</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map(item => (
                              <div key={item.id} className="flex items-start">
                                <svg className="w-5 h-5 text-[#5E2BFF] mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <div>
                                  <p className="font-medium text-gray-800">{item.name}</p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600">{item.description}</p>
                                  )}
                                  {item.quantity > 1 && (
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info-needed' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Information We Need to Know</h2>
                  
                  {infoNeeded ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: infoNeeded }} />
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-6">
                        Here's some information we need before your arrival:
                      </p>

                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-2">Arrival Details</h3>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Your expected arrival time</li>
                            <li>• Mode of transportation (car, train, etc.)</li>
                            <li>• Number of guests arriving</li>
                          </ul>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-2">Contact Information</h3>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Mobile phone number for check-in coordination</li>
                            <li>• Emergency contact details</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-2">Special Requests</h3>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Dietary restrictions or preferences</li>
                            <li>• Accessibility requirements</li>
                            <li>• Any other special needs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'how-to-get' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">How To Get There</h2>
                  
                  {directions.length > 0 ? (
                    <div className="space-y-6">
                      {directions.filter(d => d.direction_type === 'driving').length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">By Car</h3>
                          <div className="space-y-4">
                            {directions
                              .filter(d => d.direction_type === 'driving')
                              .map(direction => (
                                <div key={direction.id} className="rounded-lg overflow-hidden border border-gray-200">
                                  <img 
                                    src={direction.photo_url} 
                                    alt="Driving directions" 
                                    className="w-full object-cover"
                                  />
                                  {direction.description && (
                                    <div className="p-4 bg-gray-50">
                                      <p className="text-sm text-gray-700">{direction.description}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                      
                      {directions.filter(d => d.direction_type === 'train').length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">By Public Transport</h3>
                          <div className="space-y-4">
                            {directions
                              .filter(d => d.direction_type === 'train')
                              .map(direction => (
                                <div key={direction.id} className="rounded-lg overflow-hidden border border-gray-200">
                                  <img 
                                    src={direction.photo_url} 
                                    alt="Public transport directions" 
                                    className="w-full object-cover"
                                  />
                                  {direction.description && (
                                    <div className="p-4 bg-gray-50">
                                      <p className="text-sm text-gray-700">{direction.description}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600">No directions information available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checkout Instructions */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b">
                <h3 className="font-bold text-gray-800">Istruzioni per il checkout</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gli elementi contrassegnati con * sono obbligatori prima del checkout
                </p>
              </div>
              
              <div className="divide-y">
                {instructions.map((instruction) => (
                  <div key={instruction.id} className="p-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 pt-0.5">
                        <button
                          onClick={() => toggleCompleted(instruction.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            completed[instruction.id]
                              ? 'bg-[#5E2BFF] border-[#5E2BFF] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {completed[instruction.id] && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-800">
                          {instruction.title}
                          {instruction.is_required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          {instruction.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {instructions.some(i => i.is_required) && (
              <div className={`fixed bottom-20 left-0 right-0 p-4 bg-white border-t shadow-lg transition-opacity duration-300 ${
                allRequiredCompleted() ? 'bg-green-50' : 'bg-white'
              }`}>
                <div className="max-w-lg mx-auto">
                  {allRequiredCompleted() ? (
                    <div className="flex items-center text-green-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Tutte le attività richieste completate!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">Completa tutte le attività richieste</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checkout Checklist */}
            <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Checkout Checklist</h2>
              <p className="text-sm text-gray-600 mb-4">Please check each item before you leave your home.</p>
              
              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.lights ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('lights')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.lights ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.lights && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Turn off all lights</h3>
                    <p className="text-xs text-gray-500">Check all rooms including bathroom</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.windows ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('windows')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.windows ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.windows && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Close all windows</h3>
                    <p className="text-xs text-gray-500">Don't forget balcony doors</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.appliances ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('appliances')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.appliances ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.appliances && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Turn off all appliances</h3>
                    <p className="text-xs text-gray-500">Check stove, oven, coffee maker</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.trash ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('trash')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.trash ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.trash && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Take out all trash</h3>
                    <p className="text-xs text-gray-500">Containers are located outside</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.keys ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('keys')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.keys ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.keys && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Return keys</h3>
                    <p className="text-xs text-gray-500">Follow host instructions for key return</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-3 flex items-center ${checklist.belongings ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  onClick={() => handleCheck('belongings')}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${checklist.belongings ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                    {checklist.belongings && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Check for personal items</h3>
                    <p className="text-xs text-gray-500">Look in drawers, cabinets, bathroom</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="bg-white border-t shadow-lg fixed bottom-0 left-0 right-0 w-full">
        <div className="flex justify-around items-center h-14">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-[#5E2BFF]">
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