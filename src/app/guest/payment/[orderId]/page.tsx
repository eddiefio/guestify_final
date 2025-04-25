// Server component
import PaymentClient from './PaymentClient';

export default function Page({ params }: { params: { orderId: string } }) {
  return <PaymentClient orderId={params.orderId} />;
} 