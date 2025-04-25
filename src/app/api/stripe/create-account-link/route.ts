import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-07-09'
})

export async function POST() {
  try {
    // Otteniamo l'utente corrente
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Controlla se l'host ha già un account Stripe
    const { data: existingAccount, error: queryError } = await supabase
      .from('host_stripe_accounts')
      .select('*')
      .eq('host_id', user.id)
      .single()

    let stripeAccountId

    // Se l'host ha già un account Stripe registrato
    if (existingAccount?.stripe_account_id) {
      stripeAccountId = existingAccount.stripe_account_id
    } else {
      // Crea un nuovo account Standard Stripe Connect per l'host
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: {
          host_id: user.id
        }
      })

      stripeAccountId = account.id

      // Salva l'account nel database
      const { error: insertError } = await supabase
        .from('host_stripe_accounts')
        .insert({
          host_id: user.id,
          stripe_account_id: account.id,
          stripe_account_status: 'pending'
        })

      if (insertError) {
        throw new Error(`Failed to save Stripe account: ${insertError.message}`)
      }
    }

    // Crea un link per l'onboarding dell'account
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-connect`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/onboarding-complete`,
      type: 'account_onboarding'
    })

    // Restituisci l'URL per il redirect
    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Error creating Stripe account link:', error)
    
    return NextResponse.json(
      { message: error.message || 'Failed to create Stripe account link' },
      { status: 500 }
    )
  }
} 