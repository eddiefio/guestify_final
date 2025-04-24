import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/settings'
import { NextResponse } from 'next/server'

// Middleware per next-intl
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

// Matcher per rotte da internazionalizzare
const intlMatcher = ['/((?!api|_next|.*\\..*).*)'];

// Middleware originale per Supabase Auth
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Verifica se la richiesta è per una rotta da internazionalizzare
  // Se sì, passa al middleware di next-intl
  const path = req.nextUrl.pathname;
  if (intlMatcher.some(pattern => new RegExp(pattern).test(path))) {
    return intlMiddleware(req);
  }

  // Altrimenti procedi con il middleware originale per Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; sameSite: 'lax' | 'strict' | 'none'; domain?: string; secure?: boolean; }) {
          req.cookies.set({
            name,
            value,
            ...options
          })
          res.cookies.set({
            name,
            value,
            ...options
          })
        },
        remove(name: string, options: { path: string }) {
          req.cookies.set({
            name,
            value: '',
            ...options
          })
          res.cookies.set({
            name,
            value: '',
            ...options
          })
        }
      }
    }
  );
  
  await supabase.auth.getSession()

  return res
}

export const config = {
  matcher: ['/', '/auth/:path*', '/dashboard/:path*', '/guest/:path*'],
}