'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CountrySelect } from '@/components/layout/CountrySelect'
import ProtectedRoute from '@/components/ProtectedRoute'
import ButtonLayout from '@/components/ButtonLayout'
import { toast } from 'react-hot-toast'

export default function AddPropertyClient() {
  const [formData, setFormData] = useState({
    rental_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to add a property')
      return
    }
    
    // Form validation
    if (!formData.country) {
      setError('Please select a country')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Set a timeout to avoid infinite blocks
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      })
      
      // Function to handle submission attempts
      const insertPromise = async () => {
        const { data, error } = await supabase
          .from('properties')
          .insert([
            {
              host_id: user.id,
              name: formData.rental_name,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
              country: formData.country,
            },
          ])
          .select()
          .single()
          
        if (error) throw error
        return data
      }
      
      // Race to handle timeout
      const data = await Promise.race([insertPromise(), timeoutPromise])
      
      setSuccess(true)
      toast.success('Property added successfully!')
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Error creating property:', error)
      setError(error.message || 'Failed to create property. Please try again.')
      setLoading(false)
    }
  }

  // If successful, show a message instead of the form
  if (success) {
    return (
      <ProtectedRoute>
        <Layout title="Property Added - Guestify">
          <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              Property added successfully! Redirecting to dashboard...
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout title="Add Property - Guestify">
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
          <h2 className="text-xl font-bold mb-4">Add Property</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rental_name" className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input
                type="text"
                id="rental_name"
                name="rental_name"
                value={formData.rental_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="Beach House"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Select Country</label>
              <CountrySelect
                id="country"
                name="country" 
                value={formData.country}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
                disabled={loading}
              />
              {formData.country && (
                <p className="text-xs text-green-600 mt-1">Selected: {formData.country}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="123 Main Street"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="New York"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="NY"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="10001"
                disabled={loading}
              />
            </div>
            
            <ButtonLayout 
              cancelHref="/dashboard"
              submitText="Save"
              loading={loading}
              loadingText="Saving..."
            />
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}