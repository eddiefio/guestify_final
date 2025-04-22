"use client";

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] });

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen`}>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#5E2BFF',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      
      <main>{children}</main>
    </div>
  );
} 