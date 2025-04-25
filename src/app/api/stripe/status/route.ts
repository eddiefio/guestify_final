import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeAccount } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Verifica l'autenticazione
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Ottieni i dati dell'account Stripe dell'utente
    const { data: stripeAccount } = await supabase
      .from('host_stripe_accounts')
      .select('stripe_account_id, is_enabled')
      .eq('user_id', user.id)
      .single();
    
    // Se l'utente non ha un account Stripe
    if (!stripeAccount || !stripeAccount.stripe_account_id) {
      return NextResponse.json({ 
        exists: false,
        enabled: false,
        requiresSetup: true 
      });
    }

    // Ottieni lo stato dell'account da Stripe
    const account = await getStripeAccount(stripeAccount.stripe_account_id);
    
    // Verifica se lo stato dell'account è cambiato
    const isEnabled = account.charges_enabled;
    
    // Aggiorna il database se lo stato è cambiato
    if (isEnabled !== stripeAccount.is_enabled) {
      await supabase
        .from('host_stripe_accounts')
        .update({ is_enabled: isEnabled })
        .eq('user_id', user.id);
    }

    // Restituisci lo stato dell'account
    return NextResponse.json({
      exists: true,
      enabled: isEnabled,
      requiresSetup: !account.details_submitted
    });
  } catch (error) {
    console.error('Error checking Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe account status' },
      { status: 500 }
    );
  }
} 