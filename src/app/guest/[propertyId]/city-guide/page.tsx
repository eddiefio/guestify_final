'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CityGuide {
  id: string;
  property_id: string;
  title: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export default function CityGuidePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchCityGuide = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('city_guides')
          .select('*')
          .eq('property_id', propertyId)
          .single();
          
        if (error) {
          // If no guide found, don't treat as an error
          if (error.code === 'PGRST116') {
            setCityGuide(null);
            setLoading(false);
            return;
          }
          throw error;
        }
        
        setCityGuide(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching city guide:', err);
        setError(err.message || 'Failed to fetch city guide');
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchCityGuide();
    }
  }, [propertyId, supabase]);
  
  const getFileUrl = async () => {
    if (!cityGuide || !cityGuide.file_path) return null;
    
    try {
      const { data } = await supabase.storage
        .from('city_guides')
        .getPublicUrl(cityGuide.file_path);
      
      return data.publicUrl;
    } catch (err) {
      console.error('Error getting file URL:', err);
      return null;
    }
  };
  
  const handleViewGuide = async () => {
    const url = await getFileUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };
  
  const handleDownloadGuide = async () => {
    const url = await getFileUrl();
    if (url) {
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = cityGuide?.title || 'city-guide.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  return (
    <div className="py-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">City Guide</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : !cityGuide ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6">
          No city guide has been added for this property yet.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">{cityGuide.title}</h2>
            <p className="text-gray-600">
              Explore the city like a local with our curated guide!
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleViewGuide}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              View Guide
            </button>
            
            <button
              onClick={handleDownloadGuide}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Guide
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p>This guide contains recommendations for:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Popular attractions</li>
              <li>Local restaurants</li>
              <li>Hidden gems</li>
              <li>Transportation tips</li>
              <li>Seasonal events</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link 
          href={`/guest/${propertyId}`} 
          className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Menu
        </Link>
      </div>
    </div>
  );
} 