import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Crea il client middleware di Supabase usando la richiesta e la risposta
  const supabase = createMiddlewareClient({ req, res })
  
  // Aggiorna la sessione dell'utente se presente
  await supabase.auth.getSession()
  
  return res
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}