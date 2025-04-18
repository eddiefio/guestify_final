import EditPropertyClient from './client'

type PageParams = {
  params: {
    propertyId: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export default function EditPropertyPage({
  params,
}: PageParams) {
  return <EditPropertyClient propertyId={params.propertyId} />
}