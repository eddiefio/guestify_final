'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import { CountrySelect } from '@/components/layout/CountrySelect'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Dichiarazione per TypeScript: estende l'interfaccia Window per includere google
declare global {
  interface Window {
    google?: any;
  }
}

// Definizione delle librerie Google Maps
const libraries = ["places"];

interface EditPropertyClientProps {
  propertyId: string
}

export default function EditPropertyClient({ propertyId }: EditPropertyClientProps) {
  const [formData, setFormData] = useState({
    rental_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [propertyLoaded, setPropertyLoaded] = useState(false)
  
  // Riferimento all'input dell'indirizzo per Google Places Autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);

  // Caricamento dell'API Google Maps Places
  useEffect(() => {
    // Controlla se lo script Google Maps è già caricato
    if (!(window.google?.maps?.places) && !document.getElementById('google-maps-script')) {
      const googleMapsScript = document.createElement('script');
      googleMapsScript.id = 'google-maps-script';
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.onload = () => {
        setPlacesLoaded(true);
      };
      document.head.appendChild(googleMapsScript);
    } else if (window.google?.maps?.places) {
      setPlacesLoaded(true);
    }
  }, []);

  // Inizializzazione di Google Places Autocomplete
  useEffect(() => {
    if (placesLoaded && addressInputRef.current && window.google?.maps?.places && propertyLoaded) {
      // Pulizia di un eventuale precedente autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      
      // Creazione di una nuova istanza
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ['address_components', 'formatted_address', 'geometry'],
      });
      
      autocompleteRef.current = autocomplete;
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          // L'utente ha premuto invio nella casella di input senza selezionare un luogo
          return;
        }
        
        // Estrazione dei componenti dell'indirizzo
        const addressComponents: Record<string, string> = {};
        
        place.address_components?.forEach((component: { types: string[], long_name: string, short_name: string }) => {
          const componentType = component.types[0];
          
          switch (componentType) {
            case 'street_number':
              addressComponents.street_number = component.long_name;
              break;
            case 'route':
              addressComponents.route = component.long_name;
              break;
            case 'locality':
              addressComponents.city = component.long_name;
              break;
            case 'administrative_area_level_1':
              addressComponents.state = component.long_name;
              break;
            case 'postal_code':
              addressComponents.zip = component.long_name;
              break;
            case 'country':
              addressComponents.country = component.long_name;
              break;
            default:
              break;
          }
        });
        
        // Aggiornamento degli altri campi del form
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || addressInputRef.current?.value || '',
          city: addressComponents.city || '',
          state: addressComponents.state || '',
          zip: addressComponents.zip || '',
          country: addressComponents.country || '',
        }));
      });

      return () => {
        // Pulizia
        if (window.google?.maps && autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    }
  }, [placesLoaded, propertyLoaded]);

  useEffect(() => {
    if (!propertyId) return

    async function fetchProperty() {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single()

        if (error) throw error
        
        setFormData({
          rental_name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || '',
        })
      } catch (err: any) {
        console.error('Error fetching property:', err)
        setError('Could not load property data')
      } finally {
        setLoading(false)
        setPropertyLoaded(true)
      }
    }

    fetchProperty()
  }, [propertyId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.rental_name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        })
        .eq('id', propertyId)

      if (error) throw error
      
      toast.success('Property updated successfully!')
      
      // Redirect back to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error updating property:', err)
      setError('Failed to update property')
      setSaving(false)
      toast.error('Error updating property')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout title="Edit Property - Guestify">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF] mx-auto"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout title="Edit Property - Guestify" hasBackButton backUrl="/dashboard">
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
          <h2 className="text-xl font-bold mb-4">Edit Property</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input
                type="text"
                name="rental_name"
                value={formData.rental_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                ref={addressInputRef}
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <CountrySelect
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
              />
              {formData.country && (
                <p className="text-xs text-green-600 mt-1">Selected: {formData.country}</p>
              )}
            </div>
            
            {/* Button container */}
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <span className="inline-block px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition cursor-pointer">
                  Cancel
                </span>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-block px-4 py-2 bg-[#ffde59] text-black rounded hover:opacity-90 transition font-semibold"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}