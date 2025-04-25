import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Questa funzione verifica che la richiesta provenga effettivamente da Stripe
const verifyStripeSignature = async (req: Request) => {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing signature or webhook secret')
    throw new Error('Missing signature or webhook secret')
  }
  
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`)
    throw new Error(`Webhook Error: ${error.message}`)
  }
}

export async function POST(req: Request) {
  try {
    // Verifica la firma Stripe
    const event = await verifyStripeSignature(req)
    console.log('Stripe webhook event received:', event.type)
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Gestisci gli eventi in base al tipo
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        console.log('Account updated event for account:', account.id)
        
        // Recupera il record dell'account dalla nostra tabella
        const { data: stripeAccountData, error: accountError } = await supabase
          .from('host_stripe_accounts')
          .select('*')
          .eq('stripe_account_id', account.id)
          .single()
        
        if (accountError) {
          console.error('Error fetching account in webhook:', accountError)
        }
        
        if (stripeAccountData) {
          // Determina il nuovo stato dell'account
          let newStatus: 'active' | 'pending' | 'error' = 'pending'
          
          if (account.details_submitted && account.charges_enabled) {
            newStatus = 'active'
          } else if (account.requirements?.disabled_reason) {
            newStatus = 'error'
          }
          
          console.log('Updating account status to:', newStatus)
          
          // Aggiorna lo stato nel database
          const { error: updateError } = await supabase
            .from('host_stripe_accounts')
            .update({
              stripe_account_status: newStatus,
              connected_at: newStatus === 'active' ? new Date().toISOString() : null
            })
            .eq('stripe_account_id', account.id)
            
          if (updateError) {
            console.error('Error updating account in webhook:', updateError)
          }
        } else {
          console.log('No account found for Stripe account ID:', account.id)
        }
        break
      }
      
      // Aggiungi altri gestori di eventi secondo necessità
      default:
        console.log('Unhandled event type:', event.type)
    }
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
} 