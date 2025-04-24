import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_FILE = /\.(.*)$/;
const SUPPORTED_LOCALES = ['en', 'it', 'es', 'fr', 'zh'];

export async function middleware(req: NextRequest) {
  // Non applicare ai file statici o alle API
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('/api/') ||
    PUBLIC_FILE.test(req.nextUrl.pathname)
  ) {
    return;
  }

  const res = NextResponse.next()
  
  // Trova il codice della lingua accettata dall'utente
  const acceptLanguage = req.headers.get('accept-language') || '';
  const preferredLanguage = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().substring(0, 2))
    .find(lang => SUPPORTED_LOCALES.includes(lang));

  // Controlla se esiste già una lingua nell'URL
  const urlLocaleMatch = req.nextUrl.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const pathnameHasValidLocale = urlLocaleMatch && SUPPORTED_LOCALES.includes(urlLocaleMatch[1]);
  
  // Controlla se esiste una preferenza salvata
  const languageCookie = req.cookies.get('NEXT_LOCALE');
  
  // Create a Supabase client using the ssr package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh della sessione se necessario
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se l'URL ha una lingua valida
  if (pathnameHasValidLocale) {
    const locale = urlLocaleMatch![1];
    const pathWithoutLocale = req.nextUrl.pathname.substring(3) || '/';
    
    // Proteggi le rotte che richiedono autenticazione
    if (pathWithoutLocale.startsWith('/dashboard') && !session) {
      const redirectUrl = new URL(`/${locale}/auth/signin`, req.url);
      redirectUrl.searchParams.set('redirect', pathWithoutLocale);
      return NextResponse.redirect(redirectUrl);
    }

    // Reindirizza gli utenti autenticati dalla pagina di login alla dashboard
    if (
      (pathWithoutLocale.startsWith('/auth') || pathWithoutLocale === '/') &&
      session
    ) {
      // Non reindirizzare se l'utente sta accedendo alla pagina di aggiornamento password
      if (pathWithoutLocale === '/auth/update-password') {
        return res;
      }
      
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
    
    // Salva la lingua come cookie e continua
    res.cookies.set('NEXT_LOCALE', locale);
    return res;
  }
  
  // Se siamo qui, l'URL non ha una lingua valida
  // Priorità: cookie, preferenza browser, default 'en'
  const locale = 
    (languageCookie?.value && SUPPORTED_LOCALES.includes(languageCookie.value))
      ? languageCookie.value 
      : preferredLanguage || 'en';
  
  // Costruisci il nuovo path con la locale
  const newPath = `/${locale}${req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname}`;
  
  // Reindirizza al percorso con la lingua
  const response = NextResponse.redirect(new URL(newPath, req.url));
  response.cookies.set('NEXT_LOCALE', locale);
  
  return response;
}

// Specifica su quali percorsi eseguire il middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}