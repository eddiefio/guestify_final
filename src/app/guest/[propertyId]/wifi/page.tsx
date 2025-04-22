'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface WiFiCredentials {
  id: string;
  property_id: string;
  network_name: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export default function WiFiPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [wifiCredentials, setWifiCredentials] = useState<WiFiCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchWiFiCredentials = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single();
          
        if (error) {
          // If no credentials found, don't treat as an error
          if (error.code === 'PGRST116') {
            setWifiCredentials(null);
            setLoading(false);
            return;
          }
          throw error;
        }
        
        setWifiCredentials(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching WiFi credentials:', err);
        setError(err.message || 'Failed to fetch WiFi credentials');
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchWiFiCredentials();
    }
  }, [propertyId, supabase]);
  
  const connectToWiFi = () => {
    if (!wifiCredentials) return;
    
    // Create WiFi URL
    const wifiUrl = `WIFI:S:${wifiCredentials.network_name};T:WPA;P:${wifiCredentials.password};;`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: `WiFi: ${wifiCredentials.network_name}`,
        text: `Network: ${wifiCredentials.network_name}\nPassword: ${wifiCredentials.password}`,
        url: wifiUrl
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      toast.success('WiFi details copied to clipboard');
      navigator.clipboard.writeText(`Network: ${wifiCredentials.network_name}\nPassword: ${wifiCredentials.password}`);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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
        <h1 className="text-2xl font-bold text-gray-800">WiFi Connection</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : !wifiCredentials ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6">
          No WiFi credentials have been set for this property.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Network Name
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={wifiCredentials.network_name}
                  className="block w-full bg-gray-50 border border-gray-300 rounded-l-md py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(wifiCredentials.network_name)}
                  className="bg-gray-200 px-3 py-2 rounded-r-md hover:bg-gray-300 text-gray-700"
                  title="Copy network name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="flex">
                <input 
                  type={passwordVisible ? "text" : "password"} 
                  readOnly 
                  value={wifiCredentials.password}
                  className="block w-full bg-gray-50 border border-gray-300 rounded-l-md py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                />
                <button
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="bg-gray-200 px-3 rounded-none hover:bg-gray-300 text-gray-700"
                  title={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(wifiCredentials.password)}
                  className="bg-gray-200 px-3 py-2 rounded-r-md hover:bg-gray-300 text-gray-700"
                  title="Copy password"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <button
              onClick={connectToWiFi}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md mt-4 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Connect to WiFi
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Scan this code with your camera app to connect automatically
            </p>
            <div className="mt-2 bg-white p-2 inline-block rounded-lg border border-gray-300">
              {/* Displaying a QR code with the WiFi information */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WIFI:S:${encodeURIComponent(wifiCredentials.network_name)};T:WPA;P:${encodeURIComponent(wifiCredentials.password)};;`} 
                alt="WiFi QR Code"
                className="w-32 h-32 mx-auto"
              />
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Note: For newer phones, you can simply scan the QR code with your camera app. For older devices, you'll need to manually enter the network and password.</p>
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