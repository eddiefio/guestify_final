import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId } = body

    console.log('Conferma pagamento:', { orderId, paymentIntentId })

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 })
    }

    // Aggiorna lo stato dell'ordine a "completed"
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('stripe_payment_intent_id', paymentIntentId)

    if (updateError) {
      console.error('Errore nell\'aggiornamento dell\'ordine:', updateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to update order status'
      }, { status: 500 })
    }

    console.log('Ordine aggiornato con successo:', orderId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Errore nella conferma del pagamento:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to confirm payment'
    }, { status: 500 })
  }
} 