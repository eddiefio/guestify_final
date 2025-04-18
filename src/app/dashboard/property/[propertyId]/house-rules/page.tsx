import { Metadata } from 'next'
import HouseRulesClient from './client'

export const metadata: Metadata = {
  title: 'House Rules - Guestify',
  description: 'Manage your property house rules',
}

interface HouseRulesPageProps {
  params: {
    propertyId: string
  }
}

export default function HouseRulesPage({ params }: HouseRulesPageProps) {
  return <HouseRulesClient propertyId={params.propertyId} />
} 