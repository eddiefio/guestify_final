"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface HouseRule {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
}

export default function HouseRulesPage() {
  const [houseRules, setHouseRules] = useState<HouseRule[]>([]);
  const [propertyName, setPropertyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const propertyId = params.propertyId as string;
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!propertyId) return;

    const fetchHouseRulesAndProperty = async () => {
      try {
        setLoading(true);
        
        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single();

        if (propError) throw propError;
        
        setPropertyName(property.name);
        
        // Fetch house rules
        const { data: rules, error: rulesError } = await supabase
          .from('house_rules')
          .select('*')
          .eq('property_id', propertyId)
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (rulesError) throw rulesError;
        
        setHouseRules(rules || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHouseRulesAndProperty();
  }, [propertyId, supabase]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#5E2BFF]">Guestify</h1>
              <h2 className="text-lg font-medium text-gray-700">{propertyName}</h2>
            </div>
            <button 
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h3 className="text-xl font-semibold mb-6">House Rules</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        ) : houseRules.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
            <p>There are no house rules specified for this property.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="divide-y divide-gray-200">
              {houseRules.map((rule, index) => (
                <li key={rule.id} className="py-4">
                  <h4 className="text-lg font-medium text-gray-900">{rule.title}</h4>
                  {rule.description && (
                    <p className="mt-2 text-gray-600">{rule.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <Link 
            href={`/guest/${propertyId}`}
            className="inline-flex items-center text-[#5E2BFF] hover:text-purple-700"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back to menu
          </Link>
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