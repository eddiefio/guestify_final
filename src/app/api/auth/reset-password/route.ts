import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema di validazione
const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  code: z.string().min(1, 'Codice di verifica richiesto')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Valida i dati inviati
    const { email, password, code } = schema.parse(body);
    
    // Inizializza il client Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificare l'OTP (one-time password) per il recupero password
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery'
    });
    
    if (error) {
      console.error('Errore nella verifica OTP:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 });
    }
    
    // Se la verifica ha successo, aggiorna la password
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });
    
    if (updateError) {
      console.error('Errore nell\'aggiornamento della password:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
    
  } catch (error) {
    console.error('Errore nell\'elaborazione della richiesta:', error);
    
    if (error instanceof z.ZodError) {
      // Errore di validazione
      return NextResponse.json({ 
        success: false, 
        error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Si è verificato un errore imprevisto'
    }, { status: 500 });
  }
}