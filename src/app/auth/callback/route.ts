import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  // Per debugging, logga i parametri ricevuti
  console.log('Callback ricevuta:', { 
    code: code ? `${code.slice(0, 8)}...` : 'none',
    token_hash: token_hash ? `${token_hash.slice(0, 8)}...` : 'none',
    type
  });
  
  // Per la sicurezza, impedisci il clickjacking in questo endpoint
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Primo caso: abbiamo un token_hash (flusso OTP) 
  if (token_hash && type) {
    try {
      console.log('Tentativo di verifica OTP con token_hash');
      
      // Verifica il token OTP
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      });
      
      if (error) {
        console.error('Errore nella verifica OTP:', error);
        return NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      console.log('Verifica OTP completata con successo, tipo:', type);
      
      // Per il recupero password, reindirizza alla pagina reset-password
      // Passiamo anche il token_hash come parametro di query per permettere alla pagina
      // di gestire una possibile verifica manuale se necessario
      if (type === 'recovery') {
        const resetUrl = new URL('/auth/reset-password', requestUrl.origin);
        resetUrl.searchParams.set('token_hash', token_hash);
        resetUrl.searchParams.set('type', type);
        
        console.log('Reindirizzamento a:', resetUrl.pathname + resetUrl.search);
        return NextResponse.redirect(resetUrl);
      }
      
      // Per altri tipi (signup, ecc.), reindirizza alla dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error: any) {
      console.error('Errore non gestito nella verifica OTP:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message || 'Errore sconosciuto')}`, requestUrl.origin)
      );
    }
  }
  // Secondo caso: abbiamo un code (flusso PKCE)
  else if (code) {
    try {
      console.log('Tentativo di scambio codice per sessione');
      
      // Scambia il codice per una sessione
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Errore nello scambio del codice per una sessione:', error);
        return NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      console.log('Scambio codice completato con successo, tipo:', type);
      
      // Per il recupero password, reindirizza alla pagina reset-password
      if (type === 'recovery') {
        return NextResponse.redirect(
          new URL('/auth/reset-password', requestUrl.origin)
        );
      }
      
      // Per altri tipi, reindirizza alla dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error: any) {
      console.error('Errore non gestito nello scambio del codice:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message || 'Errore sconosciuto')}`, requestUrl.origin)
      );
    }
  } else {
    // Nessun token o codice valido
    console.error('Nessun token_hash o code valido trovato nella richiesta');
    return NextResponse.redirect(
      new URL('/auth/error?message=Link+di+autenticazione+non+valido', requestUrl.origin)
    );
  }
} 