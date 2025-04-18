import DeletePropertyClient from './client'

interface DeletePropertyPageProps {
  params: {
    propertyId: string
  }
}

export default function DeletePropertyPage({ params }: DeletePropertyPageProps) {
  return <DeletePropertyClient propertyId={params.propertyId} />
}