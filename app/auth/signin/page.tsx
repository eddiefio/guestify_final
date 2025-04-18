'use client';

import SignInForm from '../../../components/auth/SignInForm';
import AuthLayout from '../../../components/auth/AuthLayout';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for query parameters
    const newRegistration = searchParams.get('newRegistration');
    const resetSuccess = searchParams.get('reset_success');
    
    if (newRegistration === 'true') {
      setMessage('Registration successful! Please sign in with your credentials.');
    } else if (resetSuccess === 'true') {
      setMessage('Password reset successful! Please sign in with your new password.');
    }
  }, [searchParams]);

  return (
    <>
      {message && (
        <div className="mb-4 bg-green-50 text-green-500 p-3 rounded text-center">
          {message}
        </div>
      )}
      <SignInForm />
    </>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout title="Sign in to your account">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </AuthLayout>
  );
}