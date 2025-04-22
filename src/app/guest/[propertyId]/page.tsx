"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function GuestPage() {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        
        // Fetch property details
        const { data: propertyData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();

        if (propError) throw propError;
        
        setProperty(propertyData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, supabase]);

  // Array of menu items with their respective icons and paths
  const menuItems = [
    { 
      name: 'House Rules', 
      icon: '/icons/house-rules.svg',
      path: `/guest/${propertyId}/house-rules`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    },
    { 
      name: 'WiFi Connection', 
      icon: '/icons/wifi.svg',
      path: `/guest/${propertyId}/wifi-connection`,
      color: 'bg-[#ffde59]',
      textColor: 'text-gray-800'
    },
    { 
      name: 'Extra Services', 
      icon: '/icons/services.svg',
      path: `/guest/${propertyId}/extra-services`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    },
    { 
      name: 'City Guide', 
      icon: '/icons/city-guide.svg',
      path: `/guest/${propertyId}/city-guide`,
      color: 'bg-[#ffde59]',
      textColor: 'text-gray-800'
    },
    { 
      name: 'House Info', 
      icon: '/icons/house-info.svg',
      path: `/guest/${propertyId}/house-info`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    },
    { 
      name: 'Check-in Information', 
      icon: '/icons/checkin.svg',
      path: `/guest/${propertyId}/checkin-information`,
      color: 'bg-[#ffde59]',
      textColor: 'text-gray-800'
    },
    { 
      name: 'Checkout Information', 
      icon: '/icons/checkout.svg',
      path: `/guest/${propertyId}/checkout-information`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    },
    { 
      name: 'Before You Leave', 
      icon: '/icons/leave.svg',
      path: `/guest/${propertyId}/before-you-leave`,
      color: 'bg-[#ffde59]',
      textColor: 'text-gray-800'
    },
    { 
      name: 'Useful Contacts', 
      icon: '/icons/contacts.svg',
      path: `/guest/${propertyId}/useful-contacts`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    },
    { 
      name: 'Book Again', 
      icon: '/icons/book.svg',
      path: `/guest/${propertyId}/book-again`,
      color: 'bg-[#ffde59]',
      textColor: 'text-gray-800'
    },
    { 
      name: 'How Things Work', 
      icon: '/icons/how-things-work.svg',
      path: `/guest/${propertyId}/how-things-work`,
      color: 'bg-[#5E2BFF]',
      textColor: 'text-white'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Property Not Found</h2>
          <p>We couldn't find the property you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#5E2BFF]">Guestify</h1>
              <h2 className="text-lg font-medium text-gray-700">{property.name}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 py-8">
        <h3 className="text-xl font-semibold mb-6">Welcome to {property.name}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item, index) => (
            <Link 
              href={item.path} 
              key={index}
              className={`${item.color} ${item.textColor} rounded-lg p-4 h-32 flex flex-col items-center justify-center transition-transform hover:scale-105 shadow-md`}
            >
              <div className="w-10 h-10 mb-2 relative">
                <Image 
                  src={item.icon}
                  alt={item.name}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span className="text-center font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-4 mt-10">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by Guestify</p>
        </div>
      </div>
    </div>
  );
} 