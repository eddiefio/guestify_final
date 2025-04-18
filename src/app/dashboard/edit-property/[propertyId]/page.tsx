import EditPropertyClient from './client'

export default function EditPropertyPage({
  params,
}: {
  params: { propertyId: string }
}) {
  return <EditPropertyClient propertyId={params.propertyId} />
}