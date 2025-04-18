import DeletePropertyClient from './client'
import { createDynamicPageComponent } from '@/lib/pageUtils'

function DeletePropertyPage({ params }: { params: { propertyId: string } }) {
  return <DeletePropertyClient propertyId={params.propertyId} />
}

export default createDynamicPageComponent<{ propertyId: string }>(DeletePropertyPage)