// Questo è un server component (la versione predefinita in Next.js App Router)
import PaymentClient from './PaymentClient';

type PaymentPageProps = {
  params: {
    orderId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Componente server della pagina
export default function PaymentPage({ params }: PaymentPageProps) {
  return <PaymentClient orderId={params.orderId} />;
} 