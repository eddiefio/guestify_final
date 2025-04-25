import StripeConnectClient from './client';

export const metadata = {
  title: 'Stripe Connect - Guestify',
  description: 'Connect your Stripe account to receive payments',
};

export default function StripeConnectPage() {
  return <StripeConnectClient />;
} 