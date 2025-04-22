'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function GuestHomePage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setPropertyData(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching property data:', err);
        setError(err.message || 'Failed to fetch property data');
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, supabase]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error || !propertyData) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
        {error || 'Property not found'}
      </div>
    );
  }
  
  const categories = [
    { 
      name: 'House Rules', 
      icon: '📜', 
      description: 'View the house rules and policies',
      url: `/guest/${propertyId}/house-rules`,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    { 
      name: 'Extra Services', 
      icon: '🛍️', 
      description: 'Explore additional services and amenities',
      url: `/guest/${propertyId}/extra-services`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    },
    { 
      name: 'WiFi Connection', 
      icon: '📶', 
      description: 'Connect to the WiFi network',
      url: `/guest/${propertyId}/wifi`,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    },
    { 
      name: 'City Guide', 
      icon: '🗺️', 
      description: 'Discover local attractions and recommendations',
      url: `/guest/${propertyId}/city-guide`,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700'
    }
  ];
  
  return (
    <div className="py-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        Welcome to {propertyData.name}
      </h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
        Explore the following sections to make the most of your stay. We hope you enjoy your time with us!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {categories.map((category, index) => (
          <Link key={index} href={category.url} className="block transition transform hover:scale-105">
            <div className={`${category.bgColor} rounded-xl shadow p-6 h-full flex flex-col`}>
              <div className="text-4xl mb-3">{category.icon}</div>
              <h2 className={`text-xl font-bold ${category.textColor} mb-2`}>{category.name}</h2>
              <p className="text-gray-600 text-sm flex-grow">{category.description}</p>
              <div className="mt-4 text-right">
                <span className={`inline-flex items-center ${category.textColor} font-medium`}>
                  Explore
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 max-w-4xl mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Need Assistance?</h2>
        <p className="text-gray-600">
          If you have any questions or need help during your stay, please don't hesitate to contact us.
        </p>
      </div>
    </div>
  );
} 