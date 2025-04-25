// Server component
import PaymentClient from './PaymentClient';

type PageParams = {
  params: Promise<{ orderId: string }>;
};

export default async function Page({ params }: PageParams) {
  const { orderId } = await params;
  return <PaymentClient orderId={orderId} />;
} 