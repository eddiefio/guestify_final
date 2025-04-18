'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AddHouseRule() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    try {
      setLoading(true)
      
      // Prima verifichiamo che l'utente sia il proprietario
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('host_id')
        .eq('id', propertyId)
        .single()
      
      if (propertyError) throw propertyError
      
      if (propertyData.host_id !== user?.id) {
        toast.error('You do not have permission to add rules to this property')
        router.push('/dashboard')
        return
      }
      
      // Aggiungiamo la regola
      const { error } = await supabase
        .from('house_rules')
        .insert([
          {
            property_id: propertyId,
            title,
            description: description.trim() || null,
            active: true
          }
        ])
      
      if (error) throw error
      
      toast.success('House rule added successfully')
      router.push(`/dashboard/property/${propertyId}/house-rules`)
      
    } catch (error) {
      console.error('Error adding house rule:', error)
      toast.error('Failed to add house rule')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout title="Add House Rule - Guestify">
        <div className="container mx-auto px-4 py-6 font-spartan">
          <Link 
            href={`/dashboard/property/${propertyId}/house-rules`} 
            className="inline-flex items-center text-[#5E2BFF] hover:underline mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to House Rules
          </Link>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New House Rule</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                  placeholder="Enter rule title"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF] min-h-[120px]"
                  placeholder="Enter rule description (optional)"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <Link href={`/dashboard/property/${propertyId}/house-rules`}>
                  <button 
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg mr-4 hover:bg-gray-50 transition font-bold"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="bg-[#5E2BFF] text-white px-6 py-2 rounded-lg hover:bg-[#4920c4] transition font-bold disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 