'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import React from 'react'

interface HouseInfoItem {
  id: string
  property_id: string
  section_type: string
  content: string
  created_at: string
  updated_at: string
}

interface SectionInfo {
  title: string
  description: string
  icon: React.ReactNode
}

export default function GuestHouseInfo() {
  const params = useParams()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [houseInfo, setHouseInfo] = useState<Record<string, HouseInfoItem | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sectionTypes = [
    'house_rules',
    'wifi_connection',
    'how_things_work',
    'checkin_information',
    'before_you_leave',
    'checkout_information',
    'useful_contacts',
    'book_again'
  ]

  const sectionInfo: Record<string, SectionInfo> = {
    house_rules: {
      title: 'Regole della Casa',
      description: 'Regole importanti da rispettare durante il soggiorno',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
        </svg>
      )
    },
    wifi_connection: {
      title: 'Connessione WiFi',
      description: 'Informazioni per connettersi alla rete WiFi',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
        </svg>
      )
    },
    checkin_information: {
      title: 'Informazioni di Check-in',
      description: 'Tutto ciò che devi sapere per un check-in senza problemi',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    },
    checkout_information: {
      title: 'Informazioni di Check-out',
      description: 'Procedure da seguire prima della partenza',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
      )
    },
    useful_contacts: {
      title: 'Contatti Utili',
      description: 'Numeri e contatti importanti durante il soggiorno',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        </svg>
      )
    },
    how_things_work: {
      title: 'Come Funzionano le Cose',
      description: 'Istruzioni per l\'uso di elettrodomestici e attrezzature',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      )
    },
    before_you_leave: {
      title: 'Prima di Partire',
      description: 'Cosa fare prima di lasciare l\'alloggio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    book_again: {
      title: 'Prenota di Nuovo',
      description: 'Informazioni per prenotare nuovamente questo alloggio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
      )
    }
  }

  useEffect(() => {
    if (!propertyId) return

    const fetchHouseInfo = async () => {
      try {
        setLoading(true)

        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError
        setPropertyName(property.name)

        // Fetch house info sections
        const { data: houseInfoData, error: houseInfoError } = await supabase
          .from('house_info')
          .select('*')
          .eq('property_id', propertyId)

        if (houseInfoError) throw houseInfoError

        // Organize house info by section type
        const infoBySection: Record<string, HouseInfoItem | null> = {}
        sectionTypes.forEach(type => {
          infoBySection[type] = null
        })

        if (houseInfoData) {
          houseInfoData.forEach((item: HouseInfoItem) => {
            infoBySection[item.section_type] = item
          })
        }

        setHouseInfo(infoBySection)
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching house info:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchHouseInfo()
  }, [propertyId])

  // Filtra le sezioni che hanno effettivamente contenuto
  const availableSections = Object.entries(houseInfo)
    .filter(([_, item]) => item !== null)
    .map(([type, _]) => type)

  return (
    <div className="min-h-screen bg-gray-50 font-spartan">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div>
            <Link href={`/guest/${propertyId}`}>
              <span className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Indietro
              </span>
            </Link>
            <h1 className="text-xl font-bold text-[#5E2BFF] mt-1">Informazioni sulla Casa</h1>
          </div>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Caricamento informazioni...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : availableSections.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Nessuna informazione disponibile</h2>
            <p className="text-gray-600">L'host non ha ancora aggiunto informazioni sulla casa.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {availableSections.map((sectionType) => {
              const info = houseInfo[sectionType]
              const section = sectionInfo[sectionType] || {
                title: sectionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: 'Informazioni importanti',
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              }

              return info ? (
                <div key={sectionType} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <div className="prose prose-indigo max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: info.content.replace(/\n/g, '<br />') }} />
                  </div>
                </div>
              ) : null
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          <p>Powered by Guestify</p>
        </div>
      </footer>
    </div>
  )
} 