'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

// Definizione delle interfacce
interface HouseRule {
  id: string
  property_id: string
  title: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

interface SuggestedRule {
  id: string
  title: string
  description: string
}

interface HouseRulesClientProps {
  propertyId: string
}

export default function HouseRulesClient({ propertyId }: HouseRulesClientProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<{ id: string; name: string } | null>(null)
  const [houseRules, setHouseRules] = useState<HouseRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentRule, setCurrentRule] = useState<HouseRule | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })

  // Lista regole suggerite
  const suggestedRules: SuggestedRule[] = [
    { id: 'smoke', title: 'No smoking inside the house', description: 'Smoking is not allowed inside the house. Please use the designated outdoor areas.' },
    { id: 'quiet', title: 'Quiet hours from 10PM to 7AM', description: 'Please keep noise to a minimum between 10PM and 7AM to respect neighbors.' },
    { id: 'pets', title: 'No pets allowed', description: 'Pets are not allowed in the property.' },
    { id: 'parties', title: 'No parties or events', description: 'Parties or events are not permitted without prior approval.' },
    { id: 'shoes', title: 'Please remove shoes indoors', description: 'Please remove your shoes when entering the property.' },
    { id: 'checkin', title: 'Check-in after 3PM', description: 'Check-in time is after 3PM. Please let us know your estimated arrival time.' },
    { id: 'checkout', title: 'Check-out before 11AM', description: 'Check-out time is before 11AM on the day of departure.' },
    { id: 'trash', title: 'Sort trash for recycling', description: 'Please sort your trash according to the recycling guidelines provided.' }
  ]

  // Carica i dati della proprietà
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, name')
          .eq('id', propertyId)
          .single()

        if (error) throw error
        setProperty(data)
      } catch (error: any) {
        console.error('Error fetching property:', error)
        setError(error.message)
      }
    }

    fetchProperty()
  }, [propertyId])

  // Carica le house rules
  useEffect(() => {
    const fetchHouseRules = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setHouseRules(data || [])
      } catch (error: any) {
        console.error('Error fetching house rules:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchHouseRules()
    }
  }, [propertyId])

  // Gestione input form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Apri il modal per aggiungere una nuova regola
  const openAddModal = () => {
    setFormData({ title: '', description: '' })
    setIsAddModalOpen(true)
  }

  // Apri il modal per modificare una regola esistente
  const openEditModal = (rule: HouseRule) => {
    setCurrentRule(rule)
    setFormData({
      title: rule.title,
      description: rule.description || ''
    })
    setIsEditModalOpen(true)
  }

  // Chiudi tutti i modal
  const closeModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setCurrentRule(null)
    setFormData({ title: '', description: '' })
  }

  // Aggiungi regola
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!propertyId || !user) {
      toast.error('Missing required information')
      return
    }

    try {
      const { data, error } = await supabase
        .from('house_rules')
        .insert([{
          property_id: propertyId,
          title: formData.title,
          description: formData.description,
          active: true
        }])
        .select()

      if (error) throw error
      
      toast.success('House rule added successfully')
      setHouseRules(prev => [...prev, data[0]])
      closeModals()
    } catch (error: any) {
      console.error('Error adding house rule:', error)
      toast.error(error.message || 'Failed to add house rule')
    }
  }

  // Modifica regola
  const handleEditRule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentRule) {
      toast.error('No rule selected')
      return
    }

    try {
      const { data, error } = await supabase
        .from('house_rules')
        .update({
          title: formData.title,
          description: formData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRule.id)
        .select()

      if (error) throw error
      
      toast.success('House rule updated successfully')
      setHouseRules(prev => prev.map(rule => 
        rule.id === currentRule.id ? { ...rule, title: formData.title, description: formData.description } : rule
      ))
      closeModals()
    } catch (error: any) {
      console.error('Error updating house rule:', error)
      toast.error(error.message || 'Failed to update house rule')
    }
  }

  // Elimina regola
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const { error } = await supabase
        .from('house_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error
      
      toast.success('House rule deleted successfully')
      setHouseRules(prev => prev.filter(rule => rule.id !== ruleId))
    } catch (error: any) {
      console.error('Error deleting house rule:', error)
      toast.error(error.message || 'Failed to delete house rule')
    }
  }

  // Aggiungi regola suggerita
  const handleAddSuggestedRule = async (suggestedRule: SuggestedRule) => {
    if (!propertyId || !user) {
      toast.error('Missing required information')
      return
    }

    try {
      const { data, error } = await supabase
        .from('house_rules')
        .insert([{
          property_id: propertyId,
          title: suggestedRule.title,
          description: suggestedRule.description,
          active: true
        }])
        .select()

      if (error) throw error
      
      toast.success('Suggested rule added successfully')
      setHouseRules(prev => [...prev, data[0]])
    } catch (error: any) {
      console.error('Error adding suggested rule:', error)
      toast.error(error.message || 'Failed to add suggested rule')
    }
  }

  return (
    <ProtectedRoute>
      <Layout title={`House Rules - ${property?.name || 'Property'}`}>
        <div className="container mx-auto px-4 py-8 font-spartan">
          {/* Header con navigazione e titolo */}
          <div className="mb-6">
            <Link href="/dashboard" className="text-[#5E2BFF] hover:underline flex items-center mb-2 font-bold">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">House Rules</h1>
            <p className="text-gray-600">
              {property?.name ? `Property: ${property.name}` : 'Loading property...'}
            </p>
          </div>

          {/* Contenuto principale */}
          <div className="bg-white rounded-xl shadow-md p-6">
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                Error: {error}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div>
                {/* Pulsante per aggiungere nuova regola */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Your House Rules</h2>
                  <button 
                    onClick={openAddModal}
                    className="bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4517e0] transition font-bold flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Rule
                  </button>
                </div>

                {/* Lista delle regole */}
                {houseRules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p className="mb-4">No house rules added yet.</p>
                    <p>You can add your own rules or pick from our suggestions below.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    {houseRules.map((rule) => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{rule.title}</h3>
                            {rule.description && (
                              <p className="text-gray-600 mt-1">{rule.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(rule)}
                              className="text-[#5E2BFF] hover:underline font-bold text-sm"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-500 hover:underline font-bold text-sm"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regole suggerite */}
                <div className="mt-10">
                  <h2 className="text-xl font-bold mb-4">Suggested Rules</h2>
                  <p className="text-gray-600 mb-6">
                    Quick-add common house rules to your property.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedRules.map((rule) => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold">{rule.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{rule.description}</p>
                          </div>
                          <button
                            onClick={() => handleAddSuggestedRule(rule)}
                            className="bg-[#ffde59] text-black px-3 py-1 rounded-lg hover:bg-[#f8c70a] transition font-bold text-sm ml-2 shrink-0"
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal per aggiungere una regola */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add House Rule</h2>
              
              <form onSubmit={handleAddRule}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="e.g. No smoking inside"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="Additional details about this rule"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-[#4517e0] transition font-bold"
                  >
                    Add Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal per modificare una regola */}
        {isEditModalOpen && currentRule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit House Rule</h2>
              
              <form onSubmit={handleEditRule}>
                <div className="mb-4">
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="e.g. No smoking inside"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="Additional details about this rule"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-[#4517e0] transition font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
} 