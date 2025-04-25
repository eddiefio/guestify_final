import { createClient } from '@/lib/supabase/server';
import { createStripeAccount, createStripeConnectAccountLink } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
    // Controllo se l'utente ha già un account Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Se l'utente ha già un account Stripe, crea un link per continuare l'onboarding
    if (profile.stripe_account_id) {
      const accountLinkUrl = await createStripeConnectAccountLink(profile.stripe_account_id);
      return NextResponse.json({ url: accountLinkUrl });
    }

    // Altrimenti, crea un nuovo account Stripe
    const account = await createStripeAccount(user.id, profile.email || user.email || '');
    
    // Salva l'ID dell'account Stripe nel profilo dell'utente
    await supabase
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        stripe_account_enabled: false
      })
      .eq('id', user.id);

    // Crea un link per l'onboarding
    const accountLinkUrl = await createStripeConnectAccountLink(account.id);
    
    return NextResponse.json({ url: accountLinkUrl });
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
} 