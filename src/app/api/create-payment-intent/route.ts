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
    
    console.log(`API create-payment-intent: Avvio creazione per ordine ${orderId} con importo ${amount}`)
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Recupera l'ordine per ottenere property_id
    console.log(`API create-payment-intent: Recupero dettagli ordine ${orderId}`)
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
    console.log(`API create-payment-intent: Recupero proprietà ${order.property_id}`)
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('host_id')
      .eq('id', order.property_id)
      .single()
    
    if (propertyError) {
      console.error('Errore nel recupero della proprietà:', propertyError)
      return NextResponse.json({ error: 'Proprietà non trovata' }, { status: 404 })
    }
    
    // Recupera l'account Stripe dell'host
    console.log(`API create-payment-intent: Recupero account Stripe dell'host ${property.host_id}`)
    const { data: hostStripeAccount, error: hostStripeError } = await supabaseAdmin
      .from('host_stripe_accounts')
      .select('stripe_account_id, stripe_account_status')
      .eq('host_id', property.host_id)
      .single()
    
    if (hostStripeError || !hostStripeAccount) {
      console.error('Errore nel recupero dell\'account Stripe dell\'host:', hostStripeError)
      return NextResponse.json({ error: 'Account Stripe dell\'host non trovato' }, { status: 404 })
    }
    
    if (hostStripeAccount.stripe_account_status !== 'active') {
      console.error('L\'account Stripe dell\'host non è attivo:', hostStripeAccount.stripe_account_status)
      return NextResponse.json({ error: 'L\'account Stripe dell\'host non è attivo' }, { status: 400 })
    }
    
    console.log('API create-payment-intent: Creazione payment intent sull\'account dell\'host:', hostStripeAccount.stripe_account_id)
    
    try {
      // Crea un payment intent direttamente sull'account dell'host usando Stripe Connect
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe richiede centesimi
        currency: 'eur',
        automatic_payment_methods: {
          enabled: false,
        },
        payment_method_types: ['card'],
        metadata: {
          orderId,
          propertyId: order.property_id,
          hostId: property.host_id
        },
        // Non configuriamo application_fee_amount perché vogliamo che tutto il pagamento
        // vada direttamente all'host senza prelevare commissioni
      }, {
        stripeAccount: hostStripeAccount.stripe_account_id // Questo è il parametro chiave per creare un direct charge
      })
      
      console.log(`API create-payment-intent: PaymentIntent creato con successo. ID: ${paymentIntent.id}, Client Secret: ${paymentIntent.client_secret?.substring(0, 10)}...`)
    
      // Aggiorna l'ordine con l'ID del payment intent
      await supabaseAdmin
        .from('orders')
        .update({ 
          stripe_payment_intent: paymentIntent.id,
          stripe_account_id: hostStripeAccount.stripe_account_id
        })
        .eq('id', orderId)
    
      // Return the client secret
      return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        stripeAccountId: hostStripeAccount.stripe_account_id
      })
    } catch (stripeError: any) {
      console.error('Errore specifico di Stripe nella creazione del payment intent:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      })
      return NextResponse.json(
        { error: stripeError.message || 'Errore nella creazione del payment intent' },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error('Errore generale nella creazione del payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    )
  }
} 