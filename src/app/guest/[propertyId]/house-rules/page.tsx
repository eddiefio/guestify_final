'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslation } from '@/contexts/TranslationContext'
import DynamicTranslatedContent from '@/components/DynamicTranslatedContent'

interface HouseRule {
  id: string
  property_id: string
  title: string
  description: string | null
  active: boolean
  created_at: string
}

export default function HouseRulesGuest() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const { t } = useTranslation()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rules, setRules] = useState<HouseRule[]>([])
  const [propertyName, setPropertyName] = useState('')

  useEffect(() => {
    if (!propertyId) return

    const fetchHouseRules = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        setPropertyName(propertyData.name)
        
        // Fetch house rules
        const { data, error } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .eq('active', true)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setRules(data || [])
        
      } catch (error) {
        console.error('Error fetching house rules:', error)
        setError('Could not load house rules')
      } finally {
        setLoading(false)
      }
    }
    
    fetchHouseRules()
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push(`/guest/${propertyId}`)}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">{t('guest_categories.house_rules')}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-xl p-8 mx-auto max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800 mb-2">{t('rules_not_available')}</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => router.push(`/guest/${propertyId}`)}
                className="mt-6 bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-200"
              >
                {t('actions.back')}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Property name */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {t('house_rules_for')} {propertyName}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('please_follow_rules')}
              </p>
            </div>

            {rules.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-2">{t('no_house_rules')}</h3>
                <p className="text-gray-600">
                  {t('no_specific_rules')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-[#5E2BFF] text-white rounded-full h-8 w-8 flex items-center justify-center mr-4">
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            <DynamicTranslatedContent content={rule.title} />
                          </h3>
                          {rule.description && (
                            <p className="text-gray-700">
                              <DynamicTranslatedContent content={rule.description} />
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href={`/guest/${propertyId}`} className="text-[#5E2BFF] hover:underline">
                {t('actions.back')} {t('to_all_services')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 