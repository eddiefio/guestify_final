import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error in onboarding-complete:', sessionError)
    }

    if (!session) {
      console.error('No session found in onboarding-complete')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const userUid = session.user.id
    console.log('User authenticated in onboarding-complete:', userUid)

    // Ottieni l'account Stripe dell'host
    const { data: stripeAccount, error: stripeAccountError } = await supabase
      .from('host_stripe_accounts')
      .select()
      .eq('host_id', userUid)
      .single()

    if (stripeAccountError) {
      console.error('Error fetching stripe account in onboarding-complete:', stripeAccountError)
    }

    if (!stripeAccount) {
      console.error('No stripe account found for user:', userUid)
      return NextResponse.json(
        { error: 'Nessun account Stripe trovato' },
        { status: 404 }
      )
    }

    // Recupera i dettagli dell'account Stripe per verificare lo stato
    const account = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id
    )

    console.log('Stripe account details retrieved, details_submitted:', account.details_submitted)

    // Aggiorna lo stato dell'account nel database
    const { error: updateError } = await supabase
      .from('host_stripe_accounts')
      .update({
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('host_id', userUid)
      
    if (updateError) {
      console.error('Error updating stripe account status:', updateError)
    }

    // Restituisci lo stato dell'account aggiornato
    return NextResponse.json({
      success: true,
      status: account.details_submitted ? 'active' : 'pending'
    })
  } catch (error: any) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 