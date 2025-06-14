import { createServerClient } from '@supabase/ssr';
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
  
  // Create response object for cookie handling
  const response = new NextResponse();
  
  // Per la sicurezza, impedisci il clickjacking in questo endpoint
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
  
  // Garantisce la coerenza del dominio tra richiesta e redirect
  // Questo è importante perché i browser non impostano i cookie per i redirect cross-origin
  const getConsistentOrigin = (url: string) => {
    const originalHost = requestUrl.hostname;
    const targetUrl = new URL(url);
    
    // Se l'host originale è localhost o 127.0.0.1, mantieni lo stesso per il redirect
    if (originalHost === 'localhost' || originalHost === '127.0.0.1') {
      targetUrl.hostname = originalHost;
    }
    
    return targetUrl.toString();
  };
  
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
        const errorResponse = NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
        // Copy cookies from our response
        response.cookies.getAll().forEach(cookie => {
          errorResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return errorResponse;
      }
      
      console.log('Verifica OTP completata con successo, tipo:', type);
      
      // Per il recupero password, reindirizza alla pagina reset-password
      // Passiamo anche il token_hash come parametro di query per permettere alla pagina
      // di gestire una possibile verifica manuale se necessario
      if (type === 'recovery') {
        const resetUrl = new URL('/auth/reset-password', requestUrl.origin);
        resetUrl.searchParams.set('token_hash', token_hash);
        resetUrl.searchParams.set('type', type);
        
        // Assicurati che l'URL di destinazione abbia lo stesso hostname (localhost o 127.0.0.1)
        const consistentResetUrl = getConsistentOrigin(resetUrl.toString());
        
        console.log('Reindirizzamento a:', consistentResetUrl);
        const resetResponse = NextResponse.redirect(consistentResetUrl);
        // Copy cookies from our response
        response.cookies.getAll().forEach(cookie => {
          resetResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return resetResponse;
      }
      
      // Per altri tipi (signup, ecc.), reindirizza alla dashboard
      const dashboardUrl = getConsistentOrigin(new URL('/dashboard', requestUrl.origin).toString());
      const dashboardResponse = NextResponse.redirect(dashboardUrl);
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        dashboardResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return dashboardResponse;
    } catch (error: any) {
      console.error('Errore non gestito nella verifica OTP:', error);
      const errorResponse = NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message || 'Errore sconosciuto')}`, requestUrl.origin)
      );
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        errorResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return errorResponse;
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
        const errorResponse = NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
        // Copy cookies from our response
        response.cookies.getAll().forEach(cookie => {
          errorResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return errorResponse;
      }
      
      console.log('Scambio codice completato con successo, tipo:', type);
      
      // Per il recupero password, reindirizza alla pagina reset-password
      if (type === 'recovery') {
        const resetUrl = getConsistentOrigin(new URL('/auth/reset-password', requestUrl.origin).toString());
        const resetResponse = NextResponse.redirect(resetUrl);
        // Copy cookies from our response
        response.cookies.getAll().forEach(cookie => {
          resetResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return resetResponse;
      }
      
      // Per altri tipi, reindirizza alla dashboard
      const dashboardUrl = getConsistentOrigin(new URL('/dashboard', requestUrl.origin).toString());
      const dashboardResponse = NextResponse.redirect(dashboardUrl);
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        dashboardResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return dashboardResponse;
    } catch (error: any) {
      console.error('Errore non gestito nello scambio del codice:', error);
      const errorResponse = NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message || 'Errore sconosciuto')}`, requestUrl.origin)
      );
      // Copy cookies from our response
      response.cookies.getAll().forEach(cookie => {
        errorResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return errorResponse;
    }
  } else {
    // Nessun token o codice valido
    console.error('Nessun token_hash o code valido trovato nella richiesta');
    const errorResponse = NextResponse.redirect(
      new URL('/auth/error?message=Link+di+autenticazione+non+valido', requestUrl.origin)
    );
    // Copy cookies from our response
    response.cookies.getAll().forEach(cookie => {
      errorResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return errorResponse;
  }
} 