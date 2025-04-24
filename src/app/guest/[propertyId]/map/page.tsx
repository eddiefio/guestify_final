'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

// Dichiarazione per TypeScript
declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

export default function MapPage() {
  const params = useParams()
  const propertyId = params.propertyId as string
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)

  // Caricamento dell'API Google Maps
  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      // Funzione di callback quando la mappa è caricata
      window.initMap = () => {
        setMapLoaded(true)
      }

      const googleMapsScript = document.createElement('script')
      googleMapsScript.id = 'google-maps-script'
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`
      googleMapsScript.async = true
      googleMapsScript.defer = true
      document.head.appendChild(googleMapsScript)

      return () => {
        window.initMap = undefined
        const script = document.getElementById('google-maps-script')
        if (script) {
          script.remove()
        }
      }
    } else if (window.google?.maps) {
      setMapLoaded(true)
    }
  }, [])

  // Funzione per geocodificare l'indirizzo
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!window.google?.maps?.Geocoder) {
        resolve(null)
        return
      }

      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng()
          })
        } else {
          console.error('Geocodifica fallita:', status)
          resolve(null)
        }
      })
    })
  }

  // Inizializzazione della mappa quando abbiamo le coordinate
  useEffect(() => {
    if (mapLoaded && coordinates && mapRef.current) {
      const mapOptions = {
        center: coordinates,
        zoom: 15,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
      }

      // Crea una nuova mappa
      const map = new window.google.maps.Map(mapRef.current, mapOptions)
      googleMapRef.current = map

      // Crea un marker per la posizione della proprietà
      new window.google.maps.Marker({
        position: coordinates,
        map,
        title: propertyName,
        animation: window.google.maps.Animation.DROP
      })
    }
  }, [mapLoaded, coordinates, propertyName])

  // Geocodifica l'indirizzo quando viene caricato
  useEffect(() => {
    if (address && mapLoaded) {
      geocodeAddress(address).then(coords => {
        if (coords) {
          setCoordinates(coords)
        }
      })
    }
  }, [address, mapLoaded])

  useEffect(() => {
    if (!propertyId) return

    const fetchPropertyData = async () => {
      try {
        setLoading(true)

        // Debug: mostra l'ID della proprietà
        console.log('Mappa - Tentativo di caricare proprietà con ID:', propertyId);
        
        if (!propertyId) {
          throw new Error('ID della proprietà mancante');
        }
        
        // Normalizza l'ID (rimuovi spazi, converti in minuscolo)
        const normalizedId = propertyId.toString().trim();
        console.log('ID normalizzato:', normalizedId);

        // Fetch property details
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('name, address')
          .eq('id', normalizedId)
        
        console.log('Risposta Supabase:', { data: properties, error: propError });
        
        if (propError) {
          console.error('Errore Supabase:', propError);
          throw propError;
        }

        // Se non ci sono proprietà, prova a cercare con ID diversi (maiuscole/minuscole)
        if (!properties || properties.length === 0) {
          console.log('Proprietà non trovata, tentativo con ricerca più ampia...');
          
          // Prova una query ilike (case insensitive)
          const { data: propertiesAlt, error: errorAlt } = await supabase
            .from('properties')
            .select('name, address')
            .ilike('id', `%${normalizedId}%`)
            .limit(1);
          
          console.log('Risultato ricerca alternativa:', { data: propertiesAlt, error: errorAlt });
          
          if (propertiesAlt && propertiesAlt.length > 0) {
            const property = propertiesAlt[0];
            setPropertyName(property.name);
            setAddress(property.address || null);
            setLoading(false);
            return;
          }
          
          // Se ancora non abbiamo trovato la proprietà
          throw new Error('Proprietà non trovata. Verifica l\'ID o scansiona nuovamente il QR code.');
        }

        // Se ci sono più proprietà, usa la prima
        const property = properties[0];
        setPropertyName(property.name);
        setAddress(property.address || null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching property data:', error);
        setError(error.message);
        setLoading(false);
      }
    }

    fetchPropertyData()
  }, [propertyId])

  return (
    <div className="min-h-screen bg-gray-50 font-spartan flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative h-12 w-12">
              <Image 
                src="/images/logo_guest.png"
                alt="Guestify Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#5E2BFF] ml-2">Mappa</h1>
          </div>
          <div className="text-gray-700">{propertyName}</div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:px-6 w-full">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
            <p className="ml-3 text-gray-600 font-medium">Caricamento informazioni...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#5E2BFF]/20">
                <h2 className="text-lg font-bold text-[#5E2BFF]">Posizione della proprietà</h2>
                {address && <p className="text-gray-600 mt-1">{address}</p>}
              </div>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-[calc(100vh-220px)] w-full">
                {!mapLoaded || !coordinates ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4 mx-auto"></div>
                      <p className="text-gray-500">Caricamento mappa...</p>
                    </div>
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full"></div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#5E2BFF]">Luoghi di interesse nelle vicinanze</h3>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#5E2BFF]/10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold">Ristoranti</h4>
                    <p className="text-sm text-gray-600">Scopri i ristoranti vicini</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#5E2BFF]/10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold">Supermercati</h4>
                    <p className="text-sm text-gray-600">Trova i supermercati nella zona</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#5E2BFF]/10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5E2BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold">Trasporti</h4>
                    <p className="text-sm text-gray-600">Fermate degli autobus e stazioni vicine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra di navigazione */}
      <nav className="bg-white border-t shadow-lg mt-auto">
        <div className="flex justify-around items-center h-16">
          <Link href={`/guest/${propertyId}/contacts`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          <Link href={`/guest/${propertyId}/map`} className="flex flex-col items-center justify-center">
            <div className="text-2xl text-[#5E2BFF]">
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