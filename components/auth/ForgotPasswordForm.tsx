'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await forgotPassword(email);
      
      if (error) {
        throw error;
      }
      
      // Show success message
      setSuccess('Password reset instructions have been sent to your email.');
      setEmail(''); // Clear the email field
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-500 p-3 rounded">
            {success}
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}