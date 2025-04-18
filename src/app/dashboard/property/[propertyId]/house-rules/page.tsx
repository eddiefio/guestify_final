import { Metadata } from 'next'
import HouseRulesClient from './client'

export const metadata: Metadata = {
  title: 'House Rules - Guestify',
  description: 'Manage your property house rules',
}

type Props = {
  params: { propertyId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function HouseRulesPage({ params }: Props) {
  return <HouseRulesClient propertyId={params.propertyId} />
} 