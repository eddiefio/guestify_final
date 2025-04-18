import EditPropertyClient from './client'
import { createDynamicPageComponent } from '@/lib/pageUtils'

function EditPropertyPage({ params }: { params: { propertyId: string } }) {
  return <EditPropertyClient propertyId={params.propertyId} />
}

export default createDynamicPageComponent<{ propertyId: string }>(EditPropertyPage)