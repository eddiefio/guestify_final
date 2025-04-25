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
    const { orderId, propertyId, amount, stripeAccountId } = body

    if (!orderId || !propertyId || !amount || !stripeAccountId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Recupera i dettagli dell'ordine
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order fetch error:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Recupera gli elementi dell'ordine
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, extra_services(*)')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Order items fetch error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // Crea l'intento di pagamento per il Payment Element
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converte in centesimi
      currency: 'eur',
      application_fee_amount: Math.round(amount * 0.10 * 100), // 10% di commissione
      transfer_data: {
        destination: stripeAccountId,
      },
      metadata: {
        orderId: orderId,
        propertyId: propertyId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Crea la sessione Stripe per il checkout esterno
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItems.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.extra_services.title,
            description: item.extra_services.description,
          },
          unit_amount: Math.round(item.price * 100), // Stripe richiede il prezzo in centesimi
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/guest/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/guest/checkout?canceled=true`,
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 0.10 * 100), // 10% di commissione
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      metadata: {
        orderId: orderId,
        propertyId: propertyId,
      },
    })

    // Aggiorna l'ordine con l'ID della sessione Stripe
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      // Continuiamo comunque per permettere il checkout
    }

    return NextResponse.json({
      // Dati per il checkout integrato
      clientSecret: paymentIntent.client_secret,
      // Dati per il checkout esterno (se il cliente preferisce)
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe session creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 