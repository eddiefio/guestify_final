import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica che il chiamante sia autenticato
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const userUid = session.user.id
    
    // Controlla se l'host ha già un account Stripe
    const { data: stripeAccount } = await supabase
      .from('host_stripe_accounts')
      .select()
      .eq('host_uid', userUid)
      .single()
    
    if (!stripeAccount) {
      // Crea un nuovo account Stripe Connect per l'host
      const account = await stripe.accounts.create({
        type: 'standard',
        email: session.user.email,
        metadata: {
          userUid
        }
      })
      
      // Salva l'ID dell'account nella tabella host_stripe_accounts
      await supabase
        .from('host_stripe_accounts')
        .insert({
          host_uid: userUid,
          stripe_account_id: account.id,
          stripe_account_status: 'pending'
        })
      
      // Crea il link di onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect/success`,
        type: 'account_onboarding',
      })
      
      return NextResponse.json({ url: accountLink.url })
    } else {
      // Se l'account esiste già, crea solo un nuovo link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect/success`,
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