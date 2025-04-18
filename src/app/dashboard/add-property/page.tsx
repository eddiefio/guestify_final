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

export default function AddPropertyPage() {
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
      setError('Devi essere loggato per aggiungere una proprietà')
      return
    }
    
    // Validazione del form
    if (!formData.country) {
      setError('Seleziona un paese')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Impostiamo un timeout per evitare blocchi infiniti
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Richiesta scaduta')), 10000)
      })
      
      // Utilizziamo una funzione per gestire i tentativi di invio
      const insertPromise = async () => {
        const { data, error } = await supabase
          .from('apartments')
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
      
      // Race per gestire il timeout
      const data = await Promise.race([insertPromise(), timeoutPromise])
      
      setSuccess(true)
      toast.success('Proprietà aggiunta con successo!')
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Errore durante la creazione della proprietà:', error)
      setError(error.message || 'Errore durante la creazione della proprietà. Riprova.')
      setLoading(false)
    }
  }

  // Se siamo in uno stato di successo, mostriamo un messaggio invece che il form
  if (success) {
    return (
      <ProtectedRoute>
        <Layout title="Proprietà Aggiunta - Guestify">
          <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              Proprietà aggiunta con successo! Reindirizzamento alla dashboard...
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout title="Aggiungi Proprietà - Guestify">
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
          <h2 className="text-xl font-bold mb-4">Aggiungi Proprietà</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rental_name" className="block text-sm font-medium text-gray-700 mb-1">Nome della Proprietà</label>
              <input
                type="text"
                id="rental_name"
                name="rental_name"
                value={formData.rental_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="Casa al Mare"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Seleziona Paese</label>
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
                <p className="text-xs text-green-600 mt-1">Selezionato: {formData.country}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="Via Roma 123"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="Milano"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">Provincia/Stato</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="MI"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="20100"
                disabled={loading}
              />
            </div>
            
            <ButtonLayout
              cancelHref="/dashboard"
              submitText="Salva"
              loading={loading}
              loadingText="Salvataggio..."
            />
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}