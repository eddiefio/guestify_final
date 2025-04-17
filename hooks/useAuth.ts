'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Session,
  AuthError,
  AuthResponse,
  SignInWithPasswordCredentials
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { Profile, AuthState } from '../types';

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's an active session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error retrieving session:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }

        // If we have a session, set the user
        if (data.session) {
          setUser(data.session.user);

          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (!profileError && profileData) {
            setProfile(profileData);
          }
        }
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);

          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
        setAuthInitialized(true);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      // Register the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('duplicate') || 
            signUpError.message.toLowerCase().includes('already')) {
          throw new Error('User already exists');
        }
        throw signUpError;
      }

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: name
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      await supabase.auth.signOut();
      
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (newPassword: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    authInitialized,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword
  };
}