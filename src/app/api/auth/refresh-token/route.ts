import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Create a response object that we'll use to set cookies
    const res = new NextResponse(JSON.stringify({ status: 'ok' }))
    
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

    // Ottieni la sessione corrente
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error refreshing token:', error.message)
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        {
          status: 401,
          headers: res.headers // Include the headers from our response with cookies
        }
      )
    }

    // Restituisci la sessione aggiornata
    return NextResponse.json({ session: data.session }, {
      status: 200,
      headers: res.headers // Include the headers from our response with cookies
    })
  } catch (err) {
    console.error('Server error during token refresh:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}