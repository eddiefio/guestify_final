import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Controlla se l'URL contiene un token per il reset della password
  const requestUrl = new URL(request.url)
  const hasTokenHash = requestUrl.searchParams.has('token_hash')
  const type = requestUrl.searchParams.get('type')
  const isPasswordRecovery = hasTokenHash && type === 'recovery'
  
  // Se questa è una richiesta di recupero password, lasciala passare
  if (isPasswordRecovery) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Utilizziamo solo response.cookies.set per evitare problemi di duplicazione
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Utilizziamo solo response.cookies.set per evitare problemi di duplicazione
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Aggiorniamo la sessione utente in ogni richiesta
  const { data: { user } } = await supabase.auth.getUser()

  // Debug per tracciare i cookie
  console.log('Cookie disponibili:', request.cookies.getAll().map(c => c.name))
  
  // Percorso attuale
  const pathname = requestUrl.pathname
  
  // Definire percorsi pubblici che non richiedono autenticazione
  const isAuthRoute = pathname.startsWith('/dashboard')
  const isPublicAuthPath = 
    pathname.startsWith('/auth/callback') || 
    pathname.startsWith('/auth/reset-password') || 
    pathname.startsWith('/auth/signin') || 
    pathname.startsWith('/auth/signup') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname === '/auth/confirm'

  // Non reindirizzare mai i percorsi di autenticazione pubblica
  if (isPublicAuthPath) {
    return response
  }
  
  // Proteggiamo le rotte che iniziano con /dashboard
  if (isAuthRoute && !user) {
    // Reindirizza alla pagina di login se l'utente non è autenticato
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  return response
}

// Configura il matcher per specificare su quali percorsi eseguire il middleware
export const config = {
  matcher: [
    /*
     * Match tutte le route eccetto:
     * - API routes (/api/*)
     * - Files statici (es. favicon.ico)
     * - File di debug next
     */
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}