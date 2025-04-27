import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { pathname, searchParams } = requestUrl;
  
  // Percorsi pubblici che non richiedono autenticazione
  const publicAuthPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/forgot-password'
  ];
  
  // Percorsi per operazioni di autenticazione che necessitano di un trattamento speciale
  const specialAuthPaths = [
    '/auth/reset-password',
    '/auth/callback',
    '/auth/confirm'
  ];
  
  // Percorsi per le API pubbliche di pagamento
  const publicApiPaths = [
    '/api/orders/',
    '/api/create-payment-intent'
  ];
  
  // Verifica esplicitamente se abbiamo un token_hash (link di recupero password)
  const hasTokenHash = searchParams.has('token_hash');
  const hasCode = searchParams.has('code');
  const hasType = searchParams.has('type');
  
  // Log per il debugging
  if (pathname.includes('/auth/') || hasTokenHash || hasCode) {
    console.log(`Middleware check - path: ${pathname}, token_hash: ${hasTokenHash}, code: ${hasCode}, type: ${searchParams.get('type')}`);
  }
  
  // Consenti sempre l'accesso al percorso di callback (necessario per il flusso di autenticazione)
  if (pathname === '/auth/callback') {
    return NextResponse.next();
  }
  
  // Consenti accesso alle API pubbliche di pagamento senza autenticazione
  if (publicApiPaths.some(apiPath => pathname.includes(apiPath))) {
    console.log(`Consentito accesso all'API pubblica: ${pathname}`);
    return NextResponse.next();
  }
  
  // Consenti sempre l'accesso al percorso di reset-password con token_hash e type recovery
  if (pathname === '/auth/reset-password' && (hasTokenHash || (hasCode && hasType && searchParams.get('type') === 'recovery'))) {
    console.log('Permettendo l\'accesso a reset-password con token');
    return NextResponse.next();
  }
  
  // Per i percorsi protetti, verifica l'autenticazione
  // Se il percorso è pubblico o speciale, consenti l'accesso
  if (publicAuthPaths.some(path => pathname.startsWith(path)) || 
      specialAuthPaths.some(path => pathname.startsWith(path) && (hasTokenHash || hasCode))) {
    return NextResponse.next();
  }
  
  try {
    // Crea un nuovo client Supabase lato server
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            return request.cookies.get(name)?.value;
          },
          set: (name, value, options) => {
            // SSR non supporta impostazione cookie
          },
          remove: (name, options) => {
            // SSR non supporta rimozione cookie
          },
        },
      }
    );
    
    // Verifica se abbiamo una sessione valida
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log(`Nessuna sessione nel middleware, reindirizzamento a signin. Errore: ${error?.message}`);
      
      // Solo i percorsi che iniziano con /dashboard o /api sono protetti
      // Evitiamo di proteggere le API di pagamento specificate sopra
      if (pathname.startsWith('/dashboard') || 
          (pathname.startsWith('/api') && !publicApiPaths.some(apiPath => pathname.includes(apiPath)))) {
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('redirectUrl', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
    
    // Utente autenticato o percorso non protetto
    return NextResponse.next();
  } catch (error: any) {
    console.error('Errore nel middleware:', error.message);
    
    // In caso di errore, reindirizza alla pagina di errore
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('message', encodeURIComponent(error.message || 'Errore middleware'));
    return NextResponse.redirect(errorUrl);
  }
}

export const config = {
  matcher: [
    // Percorsi che richiedono il middleware
    '/dashboard/:path*',
    '/api/:path*',
    '/auth/:path*'
  ],
};