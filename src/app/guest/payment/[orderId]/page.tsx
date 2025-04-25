// Server component
import PaymentClient from './PaymentClient';

interface Props {
  params: {
    orderId: string;
  };
}

export default function Page({ params }: Props) {
  return <PaymentClient orderId={params.orderId} />;
} 