import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createStripeAccount, createStripeConnectAccountLink } from '@/lib/stripe';

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
    // Controlla se l'utente ha già un account Stripe associato
    const { data: existingAccount } = await supabase
      .from('host_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single();

    let accountId = existingAccount?.stripe_account_id;

    // Se l'utente non ha un account Stripe, creane uno nuovo
    if (!accountId) {
      // Ottieni l'email dell'utente
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!userData?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      // Crea un nuovo account Stripe
      const account = await createStripeAccount(user.id, userData.email);
      accountId = account.id;

      // Salva l'ID dell'account Stripe nel database
      await supabase
        .from('host_stripe_accounts')
        .upsert({
          user_id: user.id,
          stripe_account_id: accountId,
          is_enabled: false,
          created_at: new Date().toISOString()
        });
    }

    // Crea un link per l'onboarding di Stripe
    const url = await createStripeConnectAccountLink(accountId);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error connecting to Stripe:', error);
    return NextResponse.json(
      { error: 'Failed to connect with Stripe' },
      { status: 500 }
    );
  }
} 