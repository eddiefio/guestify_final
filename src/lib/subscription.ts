import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Mancano le variabili di ambiente per Supabase');
}

// Crea un client Supabase con ruolo di servizio per gli accessi admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verifica se l'utente ha un abbonamento attivo
 * 
 * @param userId ID dell'utente da verificare
 * @returns true se l'utente ha un abbonamento attivo, false altrimenti
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
    
    if (error) {
      console.error('Errore nel controllo dell\'abbonamento:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Errore nel controllo dell\'abbonamento:', error);
    return false;
  }
}

/**
 * Ottiene i dettagli dell'abbonamento dell'utente
 * 
 * @param userId ID dell'utente
 * @returns Dettagli dell'abbonamento o null
 */
export async function getUserSubscription(userId: string) {
  try {
    if (!userId) return null;
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (error) {
      console.error('Errore nel recupero dell\'abbonamento:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Errore nel recupero dell\'abbonamento:', error);
    return null;
  }
} 