import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// Inizializza Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // apiVersion rimosso per consentire l'aggiornamento automatico
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, amount, propertyId } = body

    console.log('Creazione payment intent:', { orderId, amount, propertyId })

    // Validazione input
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Breve ritardo per dare tempo al database di sincronizzarsi
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Ottieni i dettagli della proprietà
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('host_id')
      .eq('id', propertyId)
      .single()

    if (propertyError) {
      console.error('Errore nel recupero della proprietà:', propertyError)
      return NextResponse.json({ error: 'Error fetching property details' }, { status: 500 })
    }

    // Ottieni l'ID dell'account Stripe dell'host
    const { data: hostAccount, error: hostError } = await supabase
      .from('host_stripe_accounts')
      .select('stripe_account_id')
      .eq('host_id', property.host_id)
      .single()

    if (hostError) {
      console.error('Errore nel recupero dell\'account host:', hostError)
      return NextResponse.json({ error: 'Error fetching host account' }, { status: 500 })
    }

    if (!hostAccount?.stripe_account_id) {
      return NextResponse.json({ error: 'Host has not connected their Stripe account' }, { status: 400 })
    }

    // Converti l'importo in centesimi e assicurati che sia un intero
    const amountInCents = Math.round(amount * 100)

    // Calcola la commissione applicazione (10%)
    const feeAmount = Math.round(amountInCents * 0.10)

    console.log('Creazione payment intent con:', {
      amount: amountInCents,
      fee: feeAmount,
      destination: hostAccount.stripe_account_id,
      orderId,
      propertyId
    })

    // Crea il payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      application_fee_amount: feeAmount,
      transfer_data: {
        destination: hostAccount.stripe_account_id,
      },
      metadata: {
        orderId,
        propertyId,
        hostId: property.host_id,
        platformFee: feeAmount / 100,
      }
    })

    console.log('Payment intent creato:', paymentIntent.id)

    // Aggiorna l'ordine con l'ID del payment intent
    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Errore nell\'aggiornamento dell\'ordine:', updateError)
      // Procediamo comunque per permettere il pagamento
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error: any) {
    console.error('Errore nella creazione del payment intent:', error)
    return NextResponse.json({
      error: error.message || 'Failed to create payment intent'
    }, { status: 500 })
  }
} 