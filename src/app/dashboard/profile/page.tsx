import { Metadata } from 'next'
import ProfileClient from './client'

export const metadata: Metadata = {
  title: 'Profile - Guestify',
  description: 'Manage your profile settings',
}

export default function ProfilePage() {
  return <ProfileClient />
} 