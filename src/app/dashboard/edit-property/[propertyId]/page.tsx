import EditPropertyClient from './client'

interface PageProps {
  params: {
    propertyId: string
  }
  searchParams: Record<string, string | string[] | undefined>
}

export default function EditPropertyPage({ params, searchParams }: PageProps) {
  return <EditPropertyClient propertyId={params.propertyId} />
}