import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
  
  // Proteggiamo le rotte che iniziano con /dashboard
  const isAuthRoute = request.nextUrl.pathname.startsWith('/dashboard')
  
  if (isAuthRoute && !user) {
    // Reindirizza alla pagina di login se l'utente non è autenticato
    return NextResponse.redirect(new URL('/auth/login', request.url))
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