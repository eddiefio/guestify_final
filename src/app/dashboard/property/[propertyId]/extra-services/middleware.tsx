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
        // Prima controlla se questa è la Template House
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single();
          
        // Se è la Template House, consenti l'accesso senza controllo Stripe
        if (!propertyError && property && property.name === "Template House") {
          console.log('Template property detected, bypassing Stripe check');
          setIsStripeEnabled(true);
          setIsLoading(false);
          return;
        }
        
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

        if (!stripeAccount) {
          // Se l'utente non ha un account Stripe, reindirizza alla pagina di connessione
          toast.error('You need to connect your Stripe account to offer Extra Services');
          router.push(`/dashboard/stripe-connect?redirect=/dashboard/property/${propertyId}/extra-services`);
          return;
        }
        
        if (stripeAccount.stripe_account_status === 'pending') {
          // Se l'account è in stato di attesa, informa l'utente che deve completare la configurazione
          toast.error('You need to complete your Stripe account setup first');
          router.push(`/dashboard/stripe-connect?redirect=/dashboard/property/${propertyId}/extra-services`);
          return;
        }
        
        if (stripeAccount.stripe_account_status === 'error') {
          // Se c'è stato un errore con l'account, suggerisce di riprovare
          toast.error('There was an error with your Stripe account. Please try connecting again.');
          router.push(`/dashboard/stripe-connect?redirect=/dashboard/property/${propertyId}/extra-services`);
          return;
        }
        
        if (!hasActiveStripeAccount) {
          // Se l'account Stripe non è attivo, reindirizza alla pagina di connessione
          router.push(`/dashboard/stripe-connect?redirect=/dashboard/property/${propertyId}/extra-services`);
          toast.error('You need to set up your Stripe account to access Extra Services');
          return;
        }
        
        console.log('Stripe account is active, allowing access to Extra Services');
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