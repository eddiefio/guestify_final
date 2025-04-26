'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'

type HouseRule = {
  id: string
  title: string
  description: string | null
  active: boolean
  property_id: string
  created_at: string
}

type SuggestedRule = {
  id: string
  title: string
  description: string
}

export default function HouseRules() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<HouseRule[]>([])
  const [propertyName, setPropertyName] = useState('')
  
  // Regole suggerite comuni
  const suggestedRules: SuggestedRule[] = [
    {
      id: 'suggested-1',
      title: 'No smoking inside',
      description: 'Smoking is not allowed inside the property. You may smoke outside in designated areas only.'
    },
    {
      id: 'suggested-2',
      title: 'Quiet hours from 10PM to 8AM',
      description: 'Please respect other guests and neighbors by keeping noise to a minimum during these hours.'
    },
    {
      id: 'suggested-3',
      title: 'No parties or events',
      description: 'Unauthorized parties or events are not permitted in the property.'
    },
    {
      id: 'suggested-4',
      title: 'No pets allowed',
      description: 'Pets are not allowed in the property unless specifically arranged in advance.'
    },
    {
      id: 'suggested-5',
      title: 'Check-out by 11AM',
      description: 'Please vacate the property by 11AM on your departure day to allow time for cleaning.'
    }
  ]

  useEffect(() => {
    if (!user || !propertyId) return
    
    const fetchRules = async () => {
      try {
        setLoading(true)
        
        // Fetch property details to verify ownership and get name
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        if (propertyData.host_id !== user.id) {
          toast.error('Unauthorized access')
          router.push('/dashboard')
          return
        }
        
        setPropertyName(propertyData.name)
        
        // Fetch house rules
        const { data, error } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setRules(data || [])
        
      } catch (error) {
        console.error('Error fetching house rules:', error)
        toast.error('Failed to load house rules')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRules()
  }, [user, propertyId, router])
  
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('house_rules')
        .delete()
        .eq('id', ruleId)
      
      if (error) throw error
      
      setRules(rules.filter(rule => rule.id !== ruleId))
      toast.success('Rule deleted successfully')
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Failed to delete rule')
    }
  }
  
  const handleAddSuggestedRule = async (rule: SuggestedRule) => {
    try {
      const { data, error } = await supabase
        .from('house_rules')
        .insert([
          {
            property_id: propertyId,
            title: rule.title,
            description: rule.description,
            active: true
          }
        ])
        .select()
      
      if (error) throw error
      
      // Refresh rules
      const { data: updatedRules, error: fetchError } = await supabase
        .from('house_rules')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setRules(updatedRules || [])
      
      toast.success('Rule added successfully')
    } catch (error) {
      console.error('Error adding suggested rule:', error)
      toast.error('Failed to add rule')
    }
  }
  
  // Filter suggested rules that haven't been already added (by title)
  const filteredSuggestedRules = suggestedRules.filter(
    suggestedRule => !rules.some(rule => rule.title === suggestedRule.title)
  )

  return (
    <ProtectedRoute>
      <Layout title={`House Rules - ${propertyName}`} hasBackButton backUrl={`/dashboard/property/${propertyId}/house-info`}>
      
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">House Rules for {propertyName}</h1>
              <p className="text-gray-600 mt-1">Manage the rules for your property</p>
            </div>
            <Link href={`/dashboard/property/${propertyId}/house-rules/add`}>
              <button className="bg-[#ffde59] text-black px-4 py-2.5 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm mt-4 md:mt-0">
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Rule
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading rules...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Regole dell'utente */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your House Rules</h2>
                
                {rules.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p className="text-gray-600">You haven't added any house rules yet.</p>
                    <p className="text-gray-500 mt-1">Add rules to let your guests know what to expect.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800">{rule.title}</h3>
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/property/${propertyId}/house-rules/edit/${rule.id}`}>
                              <button className="text-[#5E2BFF] hover:underline font-bold text-sm px-2 py-1">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Edit
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-500 hover:underline font-bold text-sm px-2 py-1"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                        {rule.description && (
                          <p className="text-gray-600 mt-2 text-sm">{rule.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Regole suggerite */}
              {filteredSuggestedRules.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Suggested Rules</h2>
                  <p className="text-gray-600 mb-4">Common house rules you might want to add to your property:</p>
                  
                  <div className="space-y-4">
                    {filteredSuggestedRules.map((rule) => (
                      <div key={rule.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{rule.title}</h3>
                            <p className="text-gray-600 mt-2 text-sm">{rule.description}</p>
                          </div>
                          <button 
                            onClick={() => handleAddSuggestedRule(rule)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition font-medium text-sm flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 