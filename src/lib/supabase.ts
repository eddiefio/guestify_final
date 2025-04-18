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

// Funzione per eliminare una proprietà e tutte le risorse correlate
export const deletePropertyWithResources = async (propertyId: string) => {
  try {
    console.log(`Deleting property ${propertyId} and all related resources...`)
    
    // 1. Elimina eventuali servizi extra associati alla proprietà
    const { error: extraServicesError } = await supabase
      .from('extra_services')
      .delete()
      .eq('apartment_id', propertyId)
    
    if (extraServicesError) {
      console.error('Error deleting extra services:', extraServicesError)
      return { success: false, error: extraServicesError }
    }
    
    // 2. Elimina eventuali regole della casa associate alla proprietà
    const { error: houseRulesError } = await supabase
      .from('house_rules')
      .delete()
      .eq('apartment_id', propertyId)
    
    if (houseRulesError) {
      console.error('Error deleting house rules:', houseRulesError)
      return { success: false, error: houseRulesError }
    }
    
    // 3. Elimina eventuali configurazioni WiFi associate alla proprietà
    const { error: wifiConfigError } = await supabase
      .from('wifi_configs')
      .delete()
      .eq('apartment_id', propertyId)
    
    if (wifiConfigError) {
      console.error('Error deleting WiFi config:', wifiConfigError)
      return { success: false, error: wifiConfigError }
    }
    
    // 4. Elimina eventuali guide della città associate alla proprietà
    const { error: cityGuidesError } = await supabase
      .from('city_guides')
      .delete()
      .eq('apartment_id', propertyId)
    
    if (cityGuidesError) {
      console.error('Error deleting city guides:', cityGuidesError)
      return { success: false, error: cityGuidesError }
    }
    
    // 5. Infine, elimina la proprietà stessa
    const { error: propertyError } = await supabase
      .from('apartments')
      .delete()
      .eq('id', propertyId)
    
    if (propertyError) {
      console.error('Error deleting property:', propertyError)
      return { success: false, error: propertyError }
    }
    
    console.log(`Property ${propertyId} and all related resources deleted successfully`)
    return { success: true }
  } catch (error) {
    console.error('Exception in deletePropertyWithResources:', error)
    return { success: false, error }
  }
}

// Funzione di utilità per gestire i tentativi di invio
export const fetchWithRetry = async (fn: Function, maxRetries = 3, delay = 1000) => {
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      retries++
      console.log(`Attempt ${retries} failed. Retrying in ${delay}ms...`)
      
      if (retries >= maxRetries) {
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
      // Aumenta il ritardo per ogni nuovo tentativo (backoff esponenziale)
      delay *= 2
    }
  }
}