'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Save, Edit } from 'lucide-react'

interface InformationNeededSectionProps {
  propertyId: string
}

export default function InformationNeededSection({ propertyId }: InformationNeededSectionProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [infoId, setInfoId] = useState<string | null>(null)

  // Carica i dati dal database
  useEffect(() => {
    const loadInformation = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('information_needed')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Nessun dato trovato, è normale per una nuova proprietà
            setContent('')
            setInfoId(null)
          } else {
            throw error
          }
        } else if (data) {
          setContent(data.content)
          setInfoId(data.id)
        }
      } catch (error) {
        console.error('Error loading information:', error)
        toast.error('Unable to load requested information')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadInformation()
    }
  }, [propertyId])

  // Salva i dati nel database
  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (infoId) {
        // Aggiorna i dati esistenti
        const { error } = await supabase
          .from('information_needed')
          .update({ content })
          .eq('id', infoId)
        
        if (error) throw error
      } else {
        // Inserisci nuovi dati
        const { data, error } = await supabase
          .from('information_needed')
          .insert({ 
            property_id: propertyId,
            content 
          })
          .select()
        
        if (error) throw error
        if (data && data[0]) {
          setInfoId(data[0].id)
        }
      }
      
      setIsEditing(false)
      toast.success('Information saved successfully')
    } catch (error) {
      console.error('Error saving information:', error)
      toast.error('Unable to save information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2BFF]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800">
            Information required from guests
          </h3>
          <p className="text-sm text-gray-500">
            Specify what information you want to receive from your guests before their arrival
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] w-full sm:w-auto justify-center"
          >
            <Edit size={16} className="mr-2" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5E2BFF] focus:border-[#5E2BFF]"
            placeholder="Enter the information you want to receive from your guests (e.g., arrival time, special needs, accessibility, children, etc.)"
          />
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg">
          {content ? (
            <div className="prose max-w-none">
              {content.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No requested information specified.</p>
              <p className="mt-2">Click "Edit" to add the information you want to receive from your guests.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Tip:</strong> Clearly specify what information you want to receive from your guests before their arrival.
          For example: arrival time, special needs, accessibility requirements, presence of young children, allergies, etc.
        </p>
      </div>
    </div>
  )
} 