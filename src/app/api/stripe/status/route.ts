import { createClient } from '@/lib/supabase/server';
import { retrieveStripeAccount, isStripeAccountEnabled } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

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
    // Ottieni il profilo dell'utente con l'ID dell'account Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_enabled')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ 
        hasStripeAccount: false,
        isEnabled: false,
        requiresSetup: true
      });
    }

    // Verifica lo stato dell'account Stripe
    const account = await retrieveStripeAccount(profile.stripe_account_id);
    
    if (!account) {
      return NextResponse.json({ 
        hasStripeAccount: true,
        isEnabled: false,
        requiresSetup: true
      });
    }

    const isEnabled = isStripeAccountEnabled(account);

    // Se lo stato è cambiato, aggiorna il database
    if (isEnabled !== profile.stripe_account_enabled) {
      await supabase
        .from('profiles')
        .update({ stripe_account_enabled: isEnabled })
        .eq('id', user.id);
    }

    return NextResponse.json({
      hasStripeAccount: true,
      isEnabled,
      requiresSetup: !isEnabled,
      accountId: profile.stripe_account_id
    });
  } catch (error) {
    console.error('Error checking Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe account status' },
      { status: 500 }
    );
  }
} 