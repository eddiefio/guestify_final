'use client';

import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading, authInitialized, signOut } = useAuth();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (authInitialized && !user && !loading) {
      router.push('/auth/signin');
    }
  }, [authInitialized, user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  // Show loading state
  if (loading || !authInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome, {profile?.full_name || user.email}!</h2>
            <p className="mb-4">You have successfully signed in to your account.</p>
            <p className="text-gray-600">
              This is a simple dashboard page. In a real application, you would see your properties and other features here.
            </p>
            
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Properties</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your properties and QR codes.
                  </p>
                  <div className="mt-4">
                    <Link href="#" className="text-indigo-600 hover:text-indigo-500">
                      View properties →
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Extra Services</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage the extra services you offer to guests.
                  </p>
                  <div className="mt-4">
                    <Link href="#" className="text-indigo-600 hover:text-indigo-500">
                      View services →
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Account</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your account settings and profile.
                  </p>
                  <div className="mt-4">
                    <Link href="#" className="text-indigo-600 hover:text-indigo-500">
                      View account →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}