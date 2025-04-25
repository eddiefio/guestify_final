import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'
import { redirect } from 'next/navigation'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const userUid = session.user.id

    // Ottieni l'account Stripe dell'host
    const { data: stripeAccount } = await supabase
      .from('host_stripe_accounts')
      .select()
      .eq('host_uid', userUid)
      .single()

    if (!stripeAccount) {
      return NextResponse.json(
        { error: 'Nessun account Stripe trovato' },
        { status: 404 }
      )
    }

    // Recupera i dettagli dell'account Stripe per verificare lo stato
    const account = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id
    )

    // Aggiorna lo stato dell'account nel database
    await supabase
      .from('host_stripe_accounts')
      .update({
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('host_uid', userUid)

    // Redirect alla dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect`
    )
  } catch (error: any) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 