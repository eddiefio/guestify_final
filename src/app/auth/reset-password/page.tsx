'use client';

import { useEffect, useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';

// Component that uses useSearchParams and must be wrapped in Suspense
function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Client created with createBrowserClient
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if the user has a session (should be created when clicking the link in the email)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Add debug information
        setDebugInfo(prev => prev + '\nStarting session check...');
        
        // Get the user's session
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setDebugInfo(prev => prev + `\nError retrieving session: ${sessionError.message}`);
            throw sessionError;
          }
          
          const session = data?.session;
          
          // Check if we have a session
          if (session && session.user) {
            setDebugInfo(prev => prev + `\nSession found. User ID: ${session.user.id.slice(0, 8)}...`);
            setUserSession(session);
            // If we have a session, also get the user's email
            setEmail(session.user?.email || null);
            return;
          } else {
            setDebugInfo(prev => prev + '\nNo session found in data object');
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nException during session retrieval: ${err.message || 'Unknown error'}`);
        }
        
        // If we get here, we didn't find a session, try with getUser
        setDebugInfo(prev => prev + '\nTrying to retrieve user directly...');
        
        try {
          const { data, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setDebugInfo(prev => prev + `\nError retrieving user: ${userError.message}`);
            throw userError;
          }
          
          const user = data?.user;
          
          if (user) {
            setDebugInfo(prev => prev + `\nUser found without session. User ID: ${user.id.slice(0, 8)}...`);
            setEmail(user.email || null);
          } else {
            // If there's neither a session nor a user, display an error message
            setDebugInfo(prev => prev + '\nNo user found in data object');
            setError('No active session. Make sure you have clicked on the password recovery link in your email.');
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nException during user retrieval: ${err.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('Unhandled error during session retrieval:', error);
        setDebugInfo(prev => prev + `\nUnhandled error: ${error.message || 'Unknown error'}`);
        setError('An error occurred during session retrieval: ' + (error.message || 'Unknown error'));
      }
    };
    
    // Get token hash and type from URL
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (token_hash && type) {
      setDebugInfo(`URL parameters found: token_hash=${token_hash.slice(0, 8)}... type=${type}`);
      
      // Verify OTP directly
      const verifyOtp = async () => {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          
          if (error) {
            setDebugInfo(prev => prev + `\nError verifying OTP: ${error.message}`);
            setError(`Error verifying token: ${error.message}`);
          } else {
            setDebugInfo(prev => prev + '\nOTP token verified successfully!');
            // After verifying the OTP, check the session
            checkSession();
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nException during OTP verification: ${err.message || 'Unknown error'}`);
          setError(`Exception during token verification: ${err.message || 'Unknown error'}`);
        }
      };
      
      verifyOtp();
    } else {
      // If there are no query parameters, still check the session
      setDebugInfo('No token_hash parameter found in URL');
      checkSession();
    }
  }, [supabase, searchParams]);

  // Function to attempt to manually acquire the session
  const handleManualVerify = async () => {
    setDebugInfo(prev => prev + '\n\n--- MANUAL VERIFICATION ATTEMPT ---');
    
    // Get token hash and type from URL
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (!token_hash || !type) {
      setDebugInfo(prev => prev + '\nNo token_hash or type found in URL');
      setError('Invalid link. Make sure you use the complete password recovery link from your email.');
      return;
    }
    
    setDebugInfo(prev => prev + `\nURL parameters: token_hash=${token_hash.slice(0, 8)}... type=${type}`);
    
    try {
      // Attempt to verify the OTP token
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      
      if (error) {
        setDebugInfo(prev => prev + `\nError in manual OTP verification: ${error.message}`);
        setError(`Error verifying token: ${error.message}`);
        return;
      }
      
      setDebugInfo(prev => prev + '\nManual OTP verification completed successfully!');
      
      // Try to retrieve the session
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setDebugInfo(prev => prev + `\nError retrieving session after manual verification: ${sessionError.message}`);
          throw sessionError;
        }
        
        if (data?.session) {
          setDebugInfo(prev => prev + `\nSession acquired manually! User ID: ${data.session.user.id.slice(0, 8)}...`);
          setUserSession(data.session);
          setEmail(data.session.user?.email || null);
        } else {
          setDebugInfo(prev => prev + '\nNo session found after manual verification');
          
          // Last attempt: retrieve the user directly
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setDebugInfo(prev => prev + `\nError retrieving user after manual verification: ${userError.message}`);
          } else if (userData?.user) {
            setDebugInfo(prev => prev + `\nUser retrieved manually! User ID: ${userData.user.id.slice(0, 8)}...`);
            setEmail(userData.user.email || null);
          } else {
            setDebugInfo(prev => prev + '\nNo user found after manual verification');
            setError('Unable to acquire session. Try requesting a new password reset link.');
          }
        }
      } catch (err: any) {
        setDebugInfo(prev => prev + `\nException during manual verification: ${err.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setDebugInfo(prev => prev + `\nException during manual OTP verification: ${err.message || 'Unknown error'}`);
      setError(`Exception during token verification: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Both fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo(prev => prev + '\nAttempting password update...');
    
    try {
      // Get the user's email (which we should already have if we've reached this point)
      if (!email) {
        throw new Error('User email not found. Unable to update password.');
      }

      // This is an alternative approach that avoids session issues
      // Update the password using the email as a reference
      setDebugInfo(prev => prev + `\nUpdating password for: ${email}`);
      
      const { data, error } = await supabase.auth.updateUser({ 
        password,
      });
      
      if (error) {
        setDebugInfo(prev => prev + `\nError during update: ${error.message}`);
        throw error;
      }
      
      setDebugInfo(prev => prev + `\nPassword updated successfully! User data: ${JSON.stringify(data).slice(0, 100)}...`);
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error: any) {
      console.error('Error during password update:', error);
      setDebugInfo(prev => prev + `\nError during update: ${error.message || 'Unknown error'}`);
      setError(error.message || 'An error occurred while updating the password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <meta name="next-router-prefetch" content="false" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Reset Your Password</h1>
            {email && (
              <p className="mt-2 text-gray-600">
                For account: {email}
              </p>
            )}
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                Your password has been reset successfully! You will be redirected to the login page...
              </div>
              <Link 
                href="/auth/signin"
                className="text-indigo-600 hover:text-indigo-500"
                prefetch={false}
              >
                Return to Login Page
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              {!email ? (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
                  No session detected. Make sure you have clicked on the password recovery link in your email.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleManualVerify}
                      className="mt-2 inline-flex items-center rounded-md border border-indigo-600 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Try Manual Verification
                    </button>
                    <div className="mt-3">
                      <Link 
                        href="/auth/forgot-password" 
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        prefetch={false}
                      >
                        Request a new password recovery link
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </>
              )}

              <div className="text-center text-sm">
                <Link 
                  href="/auth/signin" 
                  className="text-indigo-600 hover:text-indigo-500"
                  prefetch={false}
                >
                  Return to Login Page
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// Simple loading component
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function ResetPassword() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordContent />
    </Suspense>
  );
} 