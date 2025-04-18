import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
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

  // Proteggi le rotte che richiedono autenticazione
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Reindirizza gli utenti autenticati dalla pagina di login alla dashboard
  if (
    (req.nextUrl.pathname.startsWith('/auth') || req.nextUrl.pathname === '/') &&
    session
  ) {
    // Non reindirizzare se l'utente sta accedendo alla pagina di aggiornamento password
    if (req.nextUrl.pathname === '/auth/update-password') {
      return res
    }
    
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// Specifica su quali percorsi eseguire il middleware
export const config = {
  matcher: ['/', '/auth/:path*', '/dashboard/:path*'],
}