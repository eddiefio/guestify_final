import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Valida l'ID dell'ordine
    if (!orderId) {
      return NextResponse.json({ error: 'ID ordine mancante' }, { status: 400 })
    }

    console.log(`API orders/[orderId]: Recupero ordine con ID: ${orderId}`)

    // Recupera i dettagli dell'ordine
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Errore nel recupero dell\'ordine:', orderError)
      
      // Se l'errore è PGRST116 (nessuna riga trovata), trattiamolo come "ordine non trovato"
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Ordine non trovato' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: `Errore nel recupero dell'ordine: ${orderError.message}` },
        { status: 500 }
      )
    }

    // Ora recuperiamo gli elementi dell'ordine
    console.log(`API orders/[orderId]: Recupero elementi per l'ordine: ${orderId}`)
    
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        *,
        extra_services(*)
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Errore nel recupero degli elementi dell\'ordine:', itemsError)
      return NextResponse.json(
        { error: `Errore nel recupero degli elementi dell'ordine: ${itemsError.message}` },
        { status: 500 }
      )
    }

    console.log(`API orders/[orderId]: Trovati ${orderItems.length} elementi per l'ordine ${orderId}`)

    // Restituisci l'ordine completo con i suoi elementi
    return NextResponse.json({
      ...order,
      items: orderItems || []
    })
  } catch (error: any) {
    console.error('Errore nella gestione della richiesta GET dell\'ordine:', error)
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    )
  }
} 