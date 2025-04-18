import { Metadata } from 'next'
import HouseRulesClient from './client'

export const metadata: Metadata = {
  title: 'House Rules - Guestify',
  description: 'Manage your property house rules',
}

export default function HouseRulesPage({ params }: { params: { propertyId: string } }) {
  return <HouseRulesClient propertyId={params.propertyId} />
} 