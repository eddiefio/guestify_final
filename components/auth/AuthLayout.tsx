'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  const { user, authInitialized } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (authInitialized && user) {
      router.push('/dashboard');
    }
  }, [authInitialized, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/vercel.svg"
                alt="Guestify"
                width={100}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{title}</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}