'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GuestLayoutProps {
  children: React.ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [propertyName, setPropertyName] = useState('');
  
  const supabase = createClientComponentClient();

  // Handle scroll event to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch property details
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId) return;
      
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single();
          
        if (error) {
          console.error('Error fetching property details:', error);
          return;
        }
        
        if (data) {
          setPropertyName(data.name);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchPropertyDetails();
  }, [propertyId, supabase]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white shadow-sm transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-4'
      }`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
          <div>
            {propertyId ? (
              <Link href={`/guest/${propertyId}`} className="cursor-pointer">
                <Image 
                  src="/images/guestify_logo.png" 
                  alt="Guestify Logo" 
                  width={160}
                  height={100}
                  quality={100}
                  priority
                  className={`transition-all duration-300 ease-in-out ${
                    isScrolled ? 'w-32 h-16' : 'w-40 h-24'
                  }`}
                  style={{ 
                    objectFit: 'contain',
                    transform: 'translateZ(0)', // Hardware acceleration
                    willChange: 'width, height' // Ottimizzazione delle animazioni
                  }}
                />
              </Link>
            ) : (
              <Image 
                src="/images/guestify_logo.png" 
                alt="Guestify Logo" 
                width={160}
                height={100}
                quality={100}
                priority
                className={`transition-all duration-300 ease-in-out ${
                  isScrolled ? 'w-32 h-16' : 'w-40 h-24'
                }`}
                style={{ 
                  objectFit: 'contain',
                  transform: 'translateZ(0)', // Hardware acceleration
                  willChange: 'width, height' // Ottimizzazione delle animazioni
                }}
              />
            )}
          </div>
          
          {propertyName && (
            <h2 className={`text-gray-800 font-semibold transition-all duration-300 ${
              isScrolled ? 'text-base' : 'text-lg'
            }`}>
              {propertyName}
            </h2>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <Image 
                src="/images/guestify_logo.png" 
                alt="Guestify Logo" 
                width={150} 
                height={60}
                className="mb-4" 
              />
              <p className="text-gray-400 text-sm">
                Enhancing your stay experience
              </p>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} Guestify. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 