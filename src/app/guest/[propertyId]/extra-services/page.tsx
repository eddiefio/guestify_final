'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface ExtraService {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ExtraServicesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ExtraService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{id: string, quantity: number, price: number, title: string}[]>([]);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchExtraServices = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('extra_services')
          .select('*')
          .eq('property_id', propertyId)
          .eq('active', true)
          .order('created_at', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setServices(data || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching extra services:', err);
        setError(err.message || 'Failed to fetch extra services');
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchExtraServices();
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem(`cart_${propertyId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
      }
    }
  }, [propertyId, supabase]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart_${propertyId}`, JSON.stringify(cart));
    } else {
      localStorage.removeItem(`cart_${propertyId}`);
    }
  }, [cart, propertyId]);
  
  const addToCart = (service: ExtraService) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      
      if (existingItem) {
        // Increment quantity if already in cart
        return prevCart.map(item => 
          item.id === service.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, {
          id: service.id,
          title: service.title,
          price: service.price,
          quantity: 1
        }];
      }
    });
    
    toast.success(`${service.title} added to cart`);
  };
  
  const removeFromCart = (serviceId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === serviceId);
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrement quantity
        return prevCart.map(item => 
          item.id === serviceId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        // Remove item completely
        return prevCart.filter(item => item.id !== serviceId);
      }
    });
  };
  
  const getItemQuantity = (serviceId: string) => {
    const item = cart.find(item => item.id === serviceId);
    return item ? item.quantity : 0;
  };
  
  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const displayPrice = (price: number) => {
    return price.toFixed(2);
  };
  
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-3 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Extra Services</h1>
        </div>
        
        {cart.length > 0 && (
          <div className="relative">
            <button 
              className="p-2 bg-blue-100 text-blue-700 rounded-full relative hover:bg-blue-200 transition"
              onClick={() => router.push(`/guest/${propertyId}/cart`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalCartItems()}
              </span>
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6">
          No extra services are available for this property.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{service.title}</h2>
              
              {service.description && (
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              )}
              
              <div className="mt-auto flex items-center justify-between">
                <div className="font-bold text-lg text-gray-800">
                  €{displayPrice(service.price)}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getItemQuantity(service.id) > 0 && (
                    <>
                      <button
                        onClick={() => removeFromCart(service.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <span className="font-medium">
                        {getItemQuantity(service.id)}
                      </span>
                    </>
                  )}
                  
                  <button
                    onClick={() => addToCart(service)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {getItemQuantity(service.id) > 0 && (
                <div className="mt-2 text-xs text-gray-500 text-right">
                  Total: €{displayPrice(service.price * getItemQuantity(service.id))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t border-gray-200">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <div className="text-gray-600 text-sm">Your total</div>
              <div className="font-bold text-lg">€{displayPrice(getTotalPrice())}</div>
            </div>
            
            <button
              onClick={() => router.push(`/guest/${propertyId}/cart`)}
              className="bg-[#5E2BFF] text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition flex items-center"
            >
              View Cart
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-8 mb-20">
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