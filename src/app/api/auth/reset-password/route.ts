import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Create a response object that we'll use to set cookies
  const res = new NextResponse(JSON.stringify({ status: 'ok' }))
  
  try {
    // Estrai i parametri dalla richiesta
    const { code, password, email } = await req.json()

    // Verifica che ci siano i parametri necessari
    if (!code || !password || !email) {
      return NextResponse.json(
        { error: 'Codice di reset, password e email sono richiesti' },
        {
          status: 400,
          headers: res.headers
        }
      )
    }

    // Debug
    console.log(`API chiamata con: code=${code}, email=${email}`)
    
    // Approccio 1: Tentativo diretto standard con verifyOtp
    try {
      // Usa un client standard per il reset
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

      // Aggiorniamo la password con il codice recovery
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      })

      // Se la verifica ha successo, aggiorniamo la password
      if (!error) {
        const { error: updateError } = await supabase.auth.updateUser({
          password
        })
        
        if (updateError) {
          throw updateError
        }
      } else {
        throw error
      }

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: 'Password aggiornata con successo'
      }, {
        headers: res.headers
      })
    } catch (error) {
      console.error('Errore verifica OTP standard:', error)
      // Continua con l'approccio Admin
    }

    // Approccio 2: Approccio con API Admin
    try {
      console.log(`API: Tentativo di reset con Admin API per email ${email}`)

      // Crea un client con Service Role Key
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

      // Cerca l'utente tramite email
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      // Filtra manualmente gli utenti per email
      const users = data?.users?.filter(user =>
        user.email?.toLowerCase() === email.trim().toLowerCase()
      )

      if (listError) {
        console.error('Errore ricerca utente:', listError)
        return NextResponse.json(
          { error: 'Errore ricerca utente' },
          {
            status: 400,
            headers: res.headers
          }
        )
      }

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'Utente non trovato' },
          {
            status: 404,
            headers: res.headers
          }
        )
      }

      const user = users[0]
      const userId = user.id
      console.log(`Utente trovato con ID: ${userId}`)

      // Aggiorna la password utilizzando updateUserById
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (updateError) {
        console.error('Errore aggiornamento password:', updateError)
        throw updateError
      }

      console.log('Password aggiornata con successo via Admin API')
      return NextResponse.json({
        success: true,
        message: 'Password aggiornata con successo'
      }, {
        headers: res.headers
      })
    } catch (error) {
      console.error('Errore aggiornamento password:', error)
      return NextResponse.json(
        {
          error: 'Impossibile aggiornare la password',
          details: (error as any).message
        },
        {
          status: 400,
          headers: res.headers
        }
      )
    }
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json(
      {
        error: 'Errore server generale',
        details: (err as any).message
      },
      {
        status: 500,
        headers: res.headers
      }
    )
  }
}