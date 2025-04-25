import { Metadata } from 'next'
import StripeConnectClient from './client'

export const metadata: Metadata = {
  title: 'Connect Stripe - Guestify',
  description: 'Connect your Stripe account to start receiving payments',
}

export default function StripeConnectPage() {
  return <StripeConnectClient />
} 