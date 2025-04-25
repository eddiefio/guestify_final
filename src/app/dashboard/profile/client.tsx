'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ProfileClient() {
  const { user, session, updatePassword } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    country: '',
    phoneNumber: '',
  })
  
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Get user metadata from Auth
        const metadata = user.user_metadata || {}
        
        // Get profile from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        
        setUserData({
          fullName: profile?.full_name || metadata.name || '',
          email: user.email || '',
          country: metadata.country || '',
          phoneNumber: profile?.phone_number || '',
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [user])
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          updated_at: new Date(),
        })
        .eq('id', user.id)
        
      if (profileError) throw profileError
      
      // Update user metadata in Auth
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { name: userData.fullName }
      })
      
      if (metadataError) throw metadataError
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: oldPassword,
      })
      
      if (signInError) {
        setPasswordError('Current password is incorrect')
        return
      }
      
      // Update password
      const { error } = await updatePassword(newPassword)
      
      if (error) throw error
      
      // Clear form
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      toast.success('Password updated successfully')
    } catch (error) {
      console.error('Error updating password:', error)
      setPasswordError('Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!user) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to view your profile</p>
          <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Your Profile</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={userData.fullName}
              onChange={(e) => setUserData({...userData, fullName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={userData.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
          
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              id="country"
              type="text"
              value={userData.country}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Country cannot be changed</p>
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={userData.phoneNumber}
              onChange={(e) => setUserData({...userData, phoneNumber: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Change Password</h2>
        
        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {passwordError}
          </div>
        )}
        
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
} 