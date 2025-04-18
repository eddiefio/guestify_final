import EditPropertyClient from './client'

interface EditPropertyPageProps {
  params: {
    propertyId: string
  }
}

export default function EditPropertyPage({ params }: EditPropertyPageProps) {
  return <EditPropertyClient propertyId={params.propertyId} />
}