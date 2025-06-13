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

  // Percorsi per le API pubbliche di pagamento e auth
  const publicApiPaths = [
    '/api/orders/',
    '/api/create-payment-intent',
    '/api/auth/refresh-token'
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

  // Implementa retry logic per la verifica della sessione
  const MAX_RETRIES = 2;
  let lastError: any = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Crea un nuovo client Supabase lato server con timeout
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name) => {
              return request.cookies.get(name)?.value;
            },
            set: (name, value, options) => {
              // SSR non supporta impostazione cookie ma non loggiamo errore
            },
            remove: (name, options) => {
              // SSR non supporta rimozione cookie ma non loggiamo errore
            },
          },
          auth: {
            // Aggiungi configurazioni di timeout per sessioni più stabili
            autoRefreshToken: true,
            persistSession: true,
          },
        }
      );

      // Verifica se abbiamo una sessione valida con timeout
      const {
        data: { user },
        error,
      } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
      ]) as any;

      if (error || !user) {
        // Se è un errore di rete e non l'ultimo tentativo, riprova
        if (error?.message?.includes('network') && attempt < MAX_RETRIES - 1) {
          console.log(`Tentativo ${attempt + 1} fallito per errore di rete, riprovo...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

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

      // Se arriviamo qui senza errori, continuiamo con la validazione normale
      break;
      
    } catch (networkError: any) {
      lastError = networkError;
      console.error(`Middleware attempt ${attempt + 1} failed:`, networkError.message);
      
      // Se è l'ultimo tentativo, fallisci
      if (attempt === MAX_RETRIES - 1) {
        console.error('Tutti i tentativi di verifica sessione falliti');
        // Per errori di rete, lascia passare per evitare di bloccare l'app
        if (networkError.message?.includes('timeout') || networkError.message?.includes('network')) {
          console.log('Errore di rete nel middleware, permetto accesso per evitare blocchi');
          return NextResponse.next();
        }
        throw networkError;
      }
      
      // Attendi prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  try {
    // Ricrea il client per le operazioni successive
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && user.id && pathname.startsWith('/dashboard')) {
      // fetcj user metadata from profiles 
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_staff')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Errore nel recupero del profilo:', profileError.message);
      } else if (profileData && profileData.is_staff) {
        if (pathname.startsWith('/dashboard/subscription')) {
          console.log('staff user, allowing access to subscription');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        console.log('details for staff, allowing access to dashboard');
        return NextResponse.next();
      }
    }

    if (user && !pathname.startsWith('/dashboard/subscription')) {
      // validat if the subscription is valid and it exists
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscriptionError || !subscriptionData) {
        return NextResponse.redirect(new URL('/dashboard/subscription', request.url));
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