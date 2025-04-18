'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { supabase, deletePropertyWithResources } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import ButtonLayout from '@/components/ButtonLayout'
import { toast } from 'react-hot-toast'

interface Property {
  id: string
  name: string
  address: string
  city: string
  country: string
}

export default function DeletePropertyPage({ params }: { params: { propertyId: string } }) {
  const propertyId = params.propertyId
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteProgress, setDeleteProgress] = useState({ step: '', completed: false })
  const router = useRouter()

  useEffect(() => {
    if (!propertyId) return

    async function fetchProperty() {
      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', propertyId)
          .single()

        if (error) throw error
        setProperty(data)
      } catch (err: any) {
        console.error('Error fetching property:', err)
        setError('Impossibile trovare la proprietà')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId])

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setDeleting(true)
      
      // Utilizziamo la funzione per eliminare la proprietà e tutte le risorse correlate
      setDeleteProgress({ step: 'Eliminazione della proprietà e delle risorse correlate...', completed: false })
      
      const result = await deletePropertyWithResources(propertyId)
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Impossibile eliminare la proprietà')
      }
      
      setDeleteProgress({ step: 'Completato!', completed: true })
      toast.success('Proprietà eliminata con successo!')
      
      // Redirect to dashboard after successful deletion
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
      
    } catch (err: any) {
      console.error('Error deleting property:', err)
      setError(`Errore durante l'eliminazione della proprietà: ${err.message}`)
      setDeleting(false)
      toast.error('Errore durante l\'eliminazione della proprietà')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout title="Elimina Proprietà - Guestify">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF] mx-auto"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout title="Elimina Proprietà - Guestify">
          <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
            
            <ButtonLayout
              cancelHref="/dashboard"
              cancelText="Torna alla Dashboard"
            />
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout title="Elimina Proprietà - Guestify">
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
          <h2 className="text-xl font-bold text-red-600 mb-4">Elimina Proprietà</h2>
          
          {property && (
            <form onSubmit={handleDelete}>
              <p className="mb-4">
                Sei sicuro di voler eliminare la proprietà:
                <span className="font-semibold block mt-2">{property.name}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">{property.address}</p>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Questa azione non può essere annullata. Tutti i dati relativi a questa proprietà saranno eliminati definitivamente, inclusi:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                      <li>Tutti i servizi extra</li>
                      <li>Tutte le regole della casa</li>
                      <li>Tutte le configurazioni WiFi</li>
                      <li>Tutte le guide della città</li>
                      <li>Tutti i codici QR</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {deleting && deleteProgress.step && (
                <div className="mb-4 bg-blue-50 p-3 rounded">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {deleteProgress.completed ? (
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      )}
                    </div>
                    <p className="text-sm text-blue-700">{deleteProgress.step}</p>
                  </div>
                </div>
              )}
              
              <ButtonLayout
                cancelHref="/dashboard"
                submitText="Elimina"
                loading={deleting}
                loadingText="Eliminazione..."
                danger={true}
              />
            </form>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}