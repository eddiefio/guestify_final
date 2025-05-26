// app/api/auth/refresh-token/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'    // <-- makes sure this runs at request-time

export async function POST(req: NextRequest) {
  const res = new NextResponse() // we'll attach cookies here

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error refreshing token:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to refresh token' }),
      { status: 401, headers: res.headers }
    )
  }

  return new NextResponse(JSON.stringify({ session: data.session }), {
    status: 200,
    headers: res.headers,
  })
}
