'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface HouseRule {
  id: string
  property_id: string
  title: string
  description: string
  icon: string
  importance: 'high' | 'medium' | 'low'
  created_at: string
}

export default function HouseRulesPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  const [rules, setRules] = useState<HouseRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Mapping per le icone delle regole
  const getIconForRule = (iconName: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'no-smoking': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h0M17 18h0M5 18h0M6 12h0M8 12h0M9 12h0M10 12h0" />
        </svg>
      ),
      'no-pets': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11l2 2m-2-2l-2-2m2 2l2-2m-2 2l-2 2M10 11l-2 2m2-2l-2-2m2 2l2-2m-2 2l-2 2" />
        </svg>
      ),
      'no-parties': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      'quiet-hours': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'shoes-off': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.293 10.293l1.414 1.414M12 18v2m-6-6h8" />
        </svg>
      ),
      'default': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    
    return iconMap[iconName] || iconMap['default']
  }
  
  // Colori basati sull'importanza della regola
  const getColorByImportance = (importance: string) => {
    switch(importance) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  useEffect(() => {
    const fetchHouseRules = async () => {
      try {
        setLoading(true)
        
        // Recupera le regole della casa per la proprietà
        const { data, error: rulesError } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .order('importance', { ascending: false })
        
        if (rulesError) {
          console.error('Error fetching house rules:', rulesError)
          throw new Error('Unable to load house rules. Please try again later.')
        }
        
        setRules(data || [])
        setLoading(false)
      } catch (error: any) {
        console.error('Error in fetch house rules:', error)
        setError(error.message)
        setLoading(false)
      }
    }
    
    fetchHouseRules()
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm py-3">
        <div className="w-full px-4 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">House Rules</h1>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Loading house rules...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6">
            No house rules have been provided for this property.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Please Follow These Rules</h2>
              
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`border rounded-lg p-4 ${getColorByImportance(rule.importance)}`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 text-current">
                        {getIconForRule(rule.icon)}
                      </div>
                      <div>
                        <h3 className="font-bold">{rule.title}</h3>
                        <p className="text-sm mt-1">{rule.description}</p>
                      </div>
                      {rule.importance === 'high' && (
                        <div className="ml-auto">
                          <span className="inline-block bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                            Important
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-xl p-5 shadow-sm border border-blue-200">
              <h2 className="text-base font-bold text-blue-800 mb-2">Friendly Reminder</h2>
              <p className="text-sm text-blue-700">
                Please respect these house rules during your stay. Non-compliance may result in additional charges or early termination of your stay. Thank you for your understanding.
              </p>
            </div>
          </div>
        )}
      </main>

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