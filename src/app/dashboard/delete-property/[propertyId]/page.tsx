import DeletePropertyClient from './client'

type PageParams = {
  params: {
    propertyId: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export default function DeletePropertyPage({
  params,
}: PageParams) {
  return <DeletePropertyClient propertyId={params.propertyId} />
}