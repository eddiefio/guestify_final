import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { status } = await request.json()

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: 'ID ordine mancante' }, { status: 400 })
    }
    
    if (!status) {
      return NextResponse.json({ error: 'Stato mancante' }, { status: 400 })
    }

    console.log(`API update-status: Aggiornamento ordine ${orderId} a stato ${status}`);

    // Prima verifichiamo che l'ordine esista
    const { data: orderCheck, error: checkError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();
      
    if (checkError) {
      console.error('Errore nel recuperare l\'ordine:', checkError);
      return NextResponse.json(
        { error: `Ordine non trovato: ${checkError.message}` },
        { status: 404 }
      );
    }
    
    console.log(`API update-status: Ordine trovato, stato attuale: ${orderCheck.status}`);

    // Update order status
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: status })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', error)
      return NextResponse.json(
        { error: `Errore nell'aggiornamento dello stato: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`API update-status: Stato aggiornato con successo a ${status}`);

    return NextResponse.json({ 
      success: true,
      message: 'Stato ordine aggiornato con successo',
      order: data
    })
  } catch (error: any) {
    console.error('Errore nella gestione della richiesta di aggiornamento stato:', error)
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    )
  }
} 