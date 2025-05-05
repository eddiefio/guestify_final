"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  user_id: string;
  status: "active" | "trialing" | "canceled" | "past_due" | "incomplete" | "incomplete_expired";
  plan_type: "monthly" | "yearly";
  price: number;
  interval: "month" | "year";
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        // Ottieni la sessione utente
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          setIsLoading(false);
          return;
        }
        
        // Ottieni l'abbonamento attivo dell'utente
        const { data, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          // PGRST116 è il codice di errore per "nessun risultato trovato", che trattiamo come null
          setError(new Error(subscriptionError.message));
        }
        
        setSubscription(data as Subscription | null);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Errore sconosciuto"));
        setIsLoading(false);
      }
    };
    
    fetchSubscription();
  }, [supabase, router]);

  // Verifica se l'utente ha un abbonamento attivo
  const hasActiveSubscription = !!subscription && 
    (subscription.status === "active" || subscription.status === "trialing");

  // Verifica se l'utente è nel periodo di prova
  const isInTrialPeriod = !!subscription && subscription.status === "trialing";

  // Calcola quanti giorni di prova rimangono
  const trialDaysLeft = isInTrialPeriod && subscription.trial_ends_at ? 
    Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // Reindirizza l'utente alla pagina di abbonamento se non ha un abbonamento attivo
  const requireSubscription = () => {
    if (!isLoading && !hasActiveSubscription) {
      router.push("/subscription");
    }
  };

  return {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    isInTrialPeriod,
    trialDaysLeft,
    requireSubscription
  };
} 