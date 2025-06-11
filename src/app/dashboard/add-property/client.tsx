'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CountrySelect } from '@/components/layout/CountrySelect'
import ProtectedRoute from '@/components/ProtectedRoute'
import ButtonLayout from '@/components/ButtonLayout'
import { toast } from 'react-hot-toast'

// Dichiarazione per TypeScript: estende l'interfaccia Window per includere google
declare global {
  interface Window {
    google?: any;
  }
}

// Definizione delle librerie Google Maps
const libraries = ["places"];

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
  
  // Riferimento all'input dell'indirizzo per Google Places Autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [placesLoaded, setPlacesLoaded] = useState(false);

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
    if (placesLoaded && addressInputRef.current && window.google?.maps?.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ['address_components', 'formatted_address', 'geometry'],
      });
      
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
        setFormData(prevData => ({
          ...prevData,
          address: place.formatted_address || addressInputRef.current?.value || '',
          city: addressComponents.city || '',
          state: addressComponents.state || '',
          zip: addressComponents.zip || '',
          country: addressComponents.country || '',
        }));
      });

      return () => {
        // Pulizia
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(autocomplete);
        }
      };
    }
  }, [placesLoaded]);

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
      
      setSuccess(true)
      toast.success('Property added successfully!')
      
      // Reset form data
      setFormData({
        rental_name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      })
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Error creating property:', error)
      setError(error.message || 'Failed to create property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If successful, show a message instead of the form
  if (success) {
    return (
      <ProtectedRoute>
        <Layout title="Property Added - Guestify" hasBackButton backUrl="/dashboard">
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
      <Layout title="Add Property - Guestify" hasBackButton backUrl="/dashboard">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Property</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-md mb-20">
            <div className="mb-4">
              <label htmlFor="rental_name" className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input
                type="text"
                id="rental_name"
                name="rental_name"
                value={formData.rental_name}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="Beach House"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                ref={addressInputRef}
                value={formData.address}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="123 Main Street"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="New York"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="NY"
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                placeholder="10001"
                disabled={loading}
              />
            </div>
            
            <div className="mb-8">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Select Country</label>
              <CountrySelect
                id="country"
                name="country" 
                value={formData.country}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                required
                disabled={loading}
              />
              {formData.country && (
                <p className="text-xs text-green-600 mt-1">Selected: {formData.country}</p>
              )}
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