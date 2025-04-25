import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json()
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Recupera l'ordine per ottenere property_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError) {
      console.error('Errore nel recupero dell\'ordine:', orderError)
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })
    }
    
    // Recupera i dettagli della proprietà per ottenere host_id
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('host_id')
      .eq('id', order.property_id)
      .single()
    
    if (propertyError) {
      console.error('Errore nel recupero della proprietà:', propertyError)
      return NextResponse.json({ error: 'Proprietà non trovata' }, { status: 404 })
    }
    
    // Recupera l'ID dell'account Stripe dell'host
    const { data: hostStripeAccount, error: hostError } = await supabaseAdmin
      .from('host_stripe_accounts')
      .select('stripe_account_id')
      .eq('host_id', property.host_id)
      .eq('stripe_account_status', 'active')
      .single()
    
    if (hostError || !hostStripeAccount) {
      console.error('Errore nel recupero dell\'account Stripe dell\'host:', hostError)
      return NextResponse.json({ error: 'Account Stripe dell\'host non trovato o non attivo' }, { status: 404 })
    }
    
    console.log('Creazione direct payment intent per l\'host con account Stripe ID:', hostStripeAccount.stripe_account_id)
    
    // Crea il payment intent direttamente sull'account dell'host (Direct Charge)
    // utilizzando Stripe Connect con l'header Stripe-Account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100), // Stripe richiede centesimi
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          propertyId: order.property_id,
          hostId: property.host_id
        }
      },
      {
        stripeAccount: hostStripeAccount.stripe_account_id // Questo è il punto chiave: crea il pagamento direttamente sull'account dell'host
      }
    )
    
    // Return the client secret
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      stripeAccountId: hostStripeAccount.stripe_account_id // Invia anche l'ID dell'account Stripe al frontend
    })
    
  } catch (error: any) {
    console.error('Errore nella creazione del payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    )
  }
} 