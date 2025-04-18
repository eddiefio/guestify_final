import DeletePropertyClient from './client'

export default function DeletePropertyPage({
  params,
}: {
  params: { propertyId: string }
}) {
  return <DeletePropertyClient propertyId={params.propertyId} />
}