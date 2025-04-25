// Server component
import PaymentClient from './PaymentClient';

type PageParams = {
  params: {
    orderId: string;
  };
};

export default async function Page({ params }: PageParams) {
  return <PaymentClient orderId={params.orderId} />;
} 