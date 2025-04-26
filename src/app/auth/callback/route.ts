import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  
  // Se non c'è un codice, reindirizza alla home
  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }

  // Per la sicurezza, impedisci il clickjacking in questo endpoint
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  if (type === 'recovery') {
    // Se è un link di recupero password, reindirizza alla pagina di reset
    // dopo aver scambiato il codice per una sessione
    try {
      // Scambia il codice per una sessione
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Errore nello scambio del codice per una sessione:', error);
        // Reindirizza a una pagina di errore con il messaggio
        return NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      // Reindirizza alla pagina di reset password
      return NextResponse.redirect(
        new URL('/auth/reset-password', requestUrl.origin)
      );
    } catch (error) {
      console.error('Errore non gestito:', error);
      // Reindirizza a una pagina di errore generica
      return NextResponse.redirect(
        new URL('/auth/error', requestUrl.origin)
      );
    }
  } else {
    // Per gli altri tipi di callback (login, signup, ecc.)
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Errore nello scambio del codice per una sessione:', error);
        // Reindirizza a una pagina di errore con il messaggio
        return NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      // Reindirizza alla dashboard o alla home
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      console.error('Errore non gestito:', error);
      // Reindirizza a una pagina di errore generica
      return NextResponse.redirect(
        new URL('/auth/error', requestUrl.origin)
      );
    }
  }
} 