"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface WifiCredential {
  id: string;
  network_name: string;
  password: string;
}

export default function WifiConnectionPage() {
  const [wifiCredentials, setWifiCredentials] = useState<WifiCredential | null>(null);
  const [propertyName, setPropertyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const propertyId = params.propertyId as string;
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!propertyId) return;

    const fetchWifiAndProperty = async () => {
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
        
        // Fetch wifi credentials
        const { data: wifi, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single();

        if (wifiError && wifiError.code !== 'PGRST116') {
          // PGRST116 is the error code for no rows returned
          throw wifiError;
        }
        
        setWifiCredentials(wifi);
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWifiAndProperty();
  }, [propertyId, supabase]);

  const handleCopyPassword = () => {
    if (!wifiCredentials) return;
    
    navigator.clipboard.writeText(wifiCredentials.password)
      .then(() => {
        toast.success('Password copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy password');
      });
  };

  const connectToWifi = () => {
    if (!wifiCredentials) return;
    
    // Create a WiFi QR code URI
    const ssid = encodeURIComponent(wifiCredentials.network_name);
    const password = encodeURIComponent(wifiCredentials.password);
    
    // This uses the wifi connection format: WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;
    const wifiUri = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    
    // Open the URI - this might work on some mobile devices
    window.location.href = wifiUri;
    
    toast.success('Attempting to connect to WiFi...');
  };

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
        <h3 className="text-xl font-semibold mb-6">WiFi Connection</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E2BFF]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        ) : !wifiCredentials ? (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
            <p>There are no WiFi credentials specified for this property.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6 text-center">
              <div className="inline-block p-6 bg-[#ffde59] rounded-full mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-gray-800" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Connect to WiFi</h4>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Network Name (SSID):</div>
                <div className="font-medium text-lg">{wifiCredentials.network_name}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Password:</div>
                <div className="font-medium text-lg flex items-center justify-between">
                  <span>{wifiCredentials.password}</span>
                  <button 
                    onClick={handleCopyPassword}
                    className="text-[#5E2BFF] hover:text-purple-700"
                    title="Copy password"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <button
                onClick={connectToWifi}
                className="w-full py-3 bg-[#5E2BFF] text-white rounded-md hover:bg-purple-700 transition shadow-md"
              >
                Connect Automatically
              </button>
              
              <div className="text-sm text-gray-500 p-4 bg-blue-50 rounded-md">
                <p>
                  <strong>Tip:</strong> If the automatic connection doesn't work, you can manually connect to this WiFi network using the credentials above.
                </p>
              </div>
            </div>
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