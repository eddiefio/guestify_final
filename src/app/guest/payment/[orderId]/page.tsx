// Questo è un server component (la versione predefinita in Next.js App Router)
import PaymentClient from './PaymentClient';

// Componente server della pagina
export default function PaymentPage({ params }: { params: { orderId: string } }) {
  return <PaymentClient orderId={params.orderId} />;
} 