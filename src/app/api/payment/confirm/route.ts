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

    // Recupera l'ordine per verificare che il paymentIntentId corrisponda e per prendere lo stripe_account_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
      
    if (orderError || !order) {
      console.error('Errore nel recupero dell\'ordine:', orderError)
      return NextResponse.json({ 
        success: false,
        error: 'Ordine non trovato'
      }, { status: 404 })
    }
    
    // Verifica che il payment intent ID corrisponda
    if (order.stripe_payment_intent !== paymentIntentId) {
      console.error('Il payment intent ID non corrisponde:', {
        stored: order.stripe_payment_intent,
        received: paymentIntentId
      })
      return NextResponse.json({ 
        success: false,
        error: 'Payment intent non valido per questo ordine'
      }, { status: 400 })
    }

    // Aggiorna lo stato dell'ordine a "completed"
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('stripe_payment_intent', paymentIntentId)

    if (updateError) {
      console.error('Errore nell\'aggiornamento dell\'ordine:', updateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to update order status'
      }, { status: 500 })
    }

    console.log('Ordine aggiornato con successo:', orderId)
    return NextResponse.json({ 
      success: true,
      message: 'Il pagamento è stato ricevuto direttamente dall\'host'
    })
  } catch (error: any) {
    console.error('Errore nella conferma del pagamento:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to confirm payment'
    }, { status: 500 })
  }
} 