import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// Inizializza Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
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

    // Crea la sessione Stripe
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
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
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      // Continuiamo comunque per permettere il checkout
    }

    return NextResponse.json({
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