import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Inizializza il client Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2023-10-16', // rimosso come richiesto
})

export async function POST(req: Request) {
  try {
    console.log('Creazione di un account link iniziata')
    
    // Inizializza il client Supabase con l'approccio moderno
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignora gli errori nelle Server Actions
              console.log('Cookie set error (ignorato):', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Ignora gli errori nelle Server Actions
              console.log('Cookie remove error (ignorato):', error)
            }
          },
        },
      }
    )
    
    // Verifica l'autenticazione dell'utente
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('Sessione non trovata in create-account-link')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Ottieni l'ID utente dalla sessione
    const userId = session.user.id

    // Cerca se l'utente ha già un account Stripe usando maybeSingle() invece di single()
    const { data: hostStripeAccount, error: fetchError } = await supabase
      .from('host_stripe_accounts')
      .select('stripe_account_id')
      .eq('host_id', userId)
      .maybeSingle()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Errore nel recupero dell\'account Stripe:', fetchError)
      return NextResponse.json({ error: 'Errore nel recupero dell\'account Stripe' }, { status: 500 })
    }

    let accountId

    if (hostStripeAccount?.stripe_account_id) {
      // Usa l'account Stripe esistente
      accountId = hostStripeAccount.stripe_account_id
      console.log('Account Stripe esistente trovato:', accountId)
    } else {
      // Crea un nuovo account Stripe
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: {
          userId,
        },
      })
      accountId = account.id
      console.log('Nuovo account Stripe creato:', accountId)

      // Salva l'ID dell'account Stripe nel database
      const { error: insertError } = await supabase
        .from('host_stripe_accounts')
        .insert({
          host_id: userId,
          stripe_account_id: accountId,
        })

      if (insertError) {
        console.error('Errore nel salvare l\'account Stripe:', insertError)
        return NextResponse.json({ error: 'Errore nel salvare l\'account Stripe' }, { status: 500 })
      }
    }

    // Ottieni l'URL di origine dalla richiesta
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Crea un link all'account
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/stripe-connect/refresh`,
      return_url: `${origin}/dashboard/stripe-connect/success`,
      type: 'account_onboarding',
    })

    console.log('Account link creato con successo')
    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Errore nella creazione dell\'account link:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 