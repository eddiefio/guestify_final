'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type StripeMiddlewareProps = {
  children: React.ReactNode;
  propertyId: string;
};

export default function StripeMiddleware({ children, propertyId }: StripeMiddlewareProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isStripeEnabled, setIsStripeEnabled] = useState(false);

  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        // Otteniamo l'utente corrente
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        // Controlliamo se l'utente ha un account Stripe e il suo stato
        const { data: stripeAccount, error } = await supabase
          .from('host_stripe_accounts')
          .select('*')
          .eq('host_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 è l'errore "non trovato"
          console.error('Error checking Stripe account:', error);
          toast.error('Error verifying your Stripe account');
          router.push('/dashboard');
          return;
        }

        // Verifichiamo se l'account esiste e se lo stato è attivo
        const hasActiveStripeAccount = stripeAccount && 
          stripeAccount.stripe_account_status === 'active';
        
        setIsStripeEnabled(hasActiveStripeAccount);

        if (!hasActiveStripeAccount) {
          // Se l'account Stripe non è abilitato, reindirizza alla pagina di connessione
          router.push('/dashboard/stripe-connect');
          toast.error('You need to set up your Stripe account to access Extra Services');
        }
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        toast.error('Error verifying your account');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkStripeStatus();
  }, [router, propertyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2BFF]"></div>
      </div>
    );
  }

  // Mostra i contenuti della pagina solo se l'account Stripe è abilitato
  return isStripeEnabled ? <>{children}</> : null;
} 