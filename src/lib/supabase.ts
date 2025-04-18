import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern per il client Supabase
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}

// Client Supabase esportato come default
export const supabase = getSupabase()

// Funzione di utilità per verificare la connessione a Supabase
export const checkSupabaseConnection = async () => {
  try {
    console.log('Verifica connessione a Supabase...')
    // Eseguiamo una query leggera per verificare la connessione
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      return { ok: false, error }
    }

    console.log('Connessione a Supabase OK')
    return { ok: true }
  } catch (e) {
    console.error('Eccezione nella verifica della connessione:', e)
    return { ok: false, error: e }
  }
}