import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Crea un client Supabase lato server con i cookie
    const supabase = createRouteHandlerClient({ cookies })

    // Ottieni la sessione corrente
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error refreshing token:', error.message)
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      )
    }

    // Restituisci la sessione aggiornata
    return NextResponse.json({ session: data.session }, { status: 200 })
  } catch (err) {
    console.error('Server error during token refresh:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}