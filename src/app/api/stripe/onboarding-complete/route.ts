import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'
import { redirect } from 'next/navigation'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-07-09'
})

export async function GET(request: Request) {
  try {
    // Otteniamo l'utente corrente
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`)
    }

    // Recupera l'account Stripe dell'host
    const { data: hostStripeAccount, error: queryError } = await supabase
      .from('host_stripe_accounts')
      .select('*')
      .eq('host_id', user.id)
      .single()

    if (queryError || !hostStripeAccount) {
      console.error('Error fetching host Stripe account:', queryError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-connect?error=account_not_found`)
    }

    // Verifica lo stato dell'account Stripe
    const stripeAccount = await stripe.accounts.retrieve(hostStripeAccount.stripe_account_id)

    // Aggiorna lo stato dell'account nel database
    let accountStatus: 'active' | 'pending' | 'error' = 'pending'
    
    if (stripeAccount.details_submitted && stripeAccount.charges_enabled) {
      accountStatus = 'active'
    } else if (stripeAccount.requirements?.disabled_reason) {
      accountStatus = 'error'
    }

    // Aggiorna lo status nel database
    await supabase
      .from('host_stripe_accounts')
      .update({
        stripe_account_status: accountStatus,
        connected_at: accountStatus === 'active' ? new Date().toISOString() : null
      })
      .eq('host_id', user.id)

    // Reindirizza l'utente alla pagina di Stripe Connect con un messaggio di successo
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-connect?status=${accountStatus}`)
  } catch (error) {
    console.error('Error processing onboarding completion:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-connect?error=process_failed`)
  }
} 