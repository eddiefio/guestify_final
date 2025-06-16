// app/api/auth/refresh-token/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'    // <-- makes sure this runs at request-time

export async function POST(req: NextRequest) {
  try {
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

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error || !data.session) {
      // If refresh fails, try to get existing session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData.session) {
        console.error('Error refreshing token:', error || sessionError)
        return new NextResponse(
          JSON.stringify({ error: 'No valid session found', session: null }),
          { status: 200, headers: res.headers } // Return 200 with null session instead of 401
        )
      }
      
      return new NextResponse(JSON.stringify({ session: sessionData.session }), {
        status: 200,
        headers: res.headers,
      })
    }

    return new NextResponse(JSON.stringify({ session: data.session }), {
      status: 200,
      headers: res.headers,
    })
  } catch (error) {
    console.error('Unexpected error in refresh-token:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', session: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } } // Return 200 with null session
    )
  }
}

// Add GET method to handle any GET requests
export async function GET(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  )
}
