'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import ProtectedRoute from '@/components/ProtectedRoute'

type FormValues = {
  title: string
  description: string
  price: number
}

export default function AddExtraService() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      price: 0
    }
  })
  
  const onSubmit = async (data: FormValues) => {
    if (!user || !propertyId) return
    
    try {
      setLoading(true)
      
      // Insert the new service
      const { error } = await supabase
        .from('extra_services')
        .insert([
          {
            property_id: propertyId,
            title: data.title,
            description: data.description,
            price: data.price,
            active: true
          }
        ])
      
      if (error) throw error
      
      toast.success('Extra service added successfully')
      
      // Redirect back to the services list
      router.push(`/dashboard/property/${propertyId}/extra-services`)
    } catch (error) {
      console.error('Error adding extra service:', error)
      toast.error('Failed to add extra service')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout title="Add Extra Service">
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex items-center mb-8">
            <Link 
              href={`/dashboard/property/${propertyId}/extra-services`} 
              className="inline-flex items-center text-[#5E2BFF] hover:underline"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to Extra Services
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Extra Service</h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  {...register('title', { 
                    required: 'Title is required',
                    maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                  placeholder="e.g. Airport Transfer"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description', { 
                    maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
                  })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                  placeholder="Provide details about this service"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (€) <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    id="price"
                    type="number"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 0, message: 'Price cannot be negative' },
                      valueAsNumber: true
                    })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Remember: Guestify takes a 12% commission on all extra service bookings.</p>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <Link href={`/dashboard/property/${propertyId}/extra-services`}>
                  <button 
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#5E2BFF] text-white rounded-lg hover:bg-[#4c22cc] transition duration-200 font-bold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Add Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 