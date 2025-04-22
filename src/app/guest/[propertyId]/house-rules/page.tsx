'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function HouseRulesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [houseRules, setHouseRules] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchHouseRules = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .eq('active', true)
          .order('created_at', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setHouseRules(data || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching house rules:', err);
        setError(err.message || 'Failed to fetch house rules');
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchHouseRules();
    }
  }, [propertyId, supabase]);
  
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
        <h1 className="text-2xl font-bold text-gray-800">House Rules</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : houseRules.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6">
          No house rules have been set for this property.
        </div>
      ) : (
        <div className="space-y-6">
          {houseRules.map((rule) => (
            <div key={rule.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{rule.title}</h2>
              {rule.description && (
                <p className="text-gray-600">{rule.description}</p>
              )}
            </div>
          ))}
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-8">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Please Note</h3>
            <p className="text-blue-600">
              These rules are in place to ensure a comfortable stay for all guests. 
              Thank you for your cooperation and understanding.
            </p>
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