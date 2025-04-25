import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    // Ottieni i dati dalla richiesta, incluso un eventuale URL di redirect
    const requestData = await req.json().catch(() => ({}))
    const redirectUrl = requestData.redirectUrl || ''
    
    // Inizializza il client Supabase
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    // Verifica che il chiamante sia autenticato
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('No session found in create-account-link')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const userUid = session.user.id
    console.log('User authenticated:', userUid)
    
    // Controlla se l'host ha già un account Stripe
    const { data: stripeAccount, error: stripeAccountError } = await supabase
      .from('host_stripe_accounts')
      .select()
      .eq('host_id', userUid)
      .single()
    
    if (stripeAccountError && stripeAccountError.code !== 'PGRST116') {
      console.error('Error fetching stripe account:', stripeAccountError)
    }
    
    // URL di base per il reindirizzamento
    const baseRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-connect`;
    // Aggiungi il parametro redirect se disponibile
    const successUrl = redirectUrl 
      ? `${baseRedirectUrl}/success?redirect=${encodeURIComponent(redirectUrl)}` 
      : `${baseRedirectUrl}/success`;
    
    if (!stripeAccount) {
      console.log('Creating new Stripe account for user:', userUid)
      // Crea un nuovo account Stripe Connect per l'host
      const account = await stripe.accounts.create({
        type: 'standard',
        email: session.user.email,
        metadata: {
          userUid
        }
      })
      
      // Salva l'ID dell'account nella tabella host_stripe_accounts
      const { error: insertError } = await supabase
        .from('host_stripe_accounts')
        .insert({
          host_id: userUid,
          stripe_account_id: account.id,
          stripe_account_status: 'pending'
        })
        
      if (insertError) {
        console.error('Error saving stripe account:', insertError)
      }
      
      // Crea il link di onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${baseRedirectUrl}/refresh`,
        return_url: successUrl,
        type: 'account_onboarding',
      })
      
      return NextResponse.json({ url: accountLink.url })
    } else {
      console.log('Using existing Stripe account:', stripeAccount.stripe_account_id)
      // Se l'account esiste già, crea solo un nuovo link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.stripe_account_id,
        refresh_url: `${baseRedirectUrl}/refresh`,
        return_url: successUrl,
        type: 'account_onboarding',
      })
      
      return NextResponse.json({ url: accountLink.url })
    }
  } catch (error: any) {
    console.error('Error creating account link:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 