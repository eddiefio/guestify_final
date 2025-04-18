import DeletePropertyClient from './client'

interface PageProps {
  params: {
    propertyId: string
  }
  searchParams: Record<string, string | string[] | undefined>
}

export default function DeletePropertyPage({ params, searchParams }: PageProps) {
  return <DeletePropertyClient propertyId={params.propertyId} />
}