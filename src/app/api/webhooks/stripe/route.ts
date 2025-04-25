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
    const supabase = createRouteHandlerClient({ cookies })
    
    // Gestisci gli eventi in base al tipo
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        
        // Recupera il record dell'account dalla nostra tabella
        const { data: stripeAccountData } = await supabase
          .from('host_stripe_accounts')
          .select('*')
          .eq('stripe_account_id', account.id)
          .single()
        
        if (stripeAccountData) {
          // Determina il nuovo stato dell'account
          let newStatus: 'active' | 'pending' | 'error' = 'pending'
          
          if (account.details_submitted && account.charges_enabled) {
            newStatus = 'active'
          } else if (account.requirements?.disabled_reason) {
            newStatus = 'error'
          }
          
          // Aggiorna lo stato nel database
          await supabase
            .from('host_stripe_accounts')
            .update({
              stripe_account_status: newStatus,
              connected_at: newStatus === 'active' ? new Date().toISOString() : null
            })
            .eq('stripe_account_id', account.id)
        }
        break
      }
      
      // Aggiungi altri gestori di eventi secondo necessità
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