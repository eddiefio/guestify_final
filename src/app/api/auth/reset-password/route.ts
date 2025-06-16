import { createServerClient } from '@supabase/ssr';
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
    
    // Create response object for cookie handling
    const response = new NextResponse();
    
    // Inizializza il client Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            response.cookies.set({ name, value, ...options });
          },
          remove: (name, options) => {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Verificare l'OTP (one-time password) per il recupero password
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery'
    });
    
    if (error) {
      console.error('Errore nella verifica OTP:', error);
      const errorResponse = NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
      
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        errorResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return errorResponse;
    }
    
    // Se la verifica ha successo, aggiorna la password
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });
    
    if (updateError) {
      console.error('Errore nell\'aggiornamento della password:', updateError);
      const errorResponse = NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 400 });
      
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        errorResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return errorResponse;
    }
    
    const successResponse = NextResponse.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
    
    // Copy cookies from our response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return successResponse;
    
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