"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { CircleOff, Clock, CheckCircle2 } from "lucide-react";

export default function SubscriptionStatus() {
  const { 
    subscription, 
    isLoading, 
    error, 
    hasActiveSubscription, 
    isInTrialPeriod, 
    trialDaysLeft 
  } = useSubscription();

  if (isLoading) {
    return <div className="p-4 rounded-md bg-gray-100 animate-pulse h-16"></div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
        <div className="flex items-center">
          <CircleOff className="h-5 w-5 mr-2" />
          <span>Errore nel caricamento dello stato dell'abbonamento</span>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
        <div className="flex items-center">
          <CircleOff className="h-5 w-5 mr-2" />
          <span>Nessun abbonamento attivo</span>
        </div>
        <div className="mt-2">
          <a 
            href="/subscription" 
            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Attiva abbonamento
          </a>
        </div>
      </div>
    );
  }

  // Se l'utente ha un abbonamento attivo
  return (
    <div className={`p-4 rounded-md ${isInTrialPeriod ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
      <div className="flex items-center">
        {isInTrialPeriod ? (
          <Clock className="h-5 w-5 mr-2" />
        ) : (
          <CheckCircle2 className="h-5 w-5 mr-2" />
        )}
        <span>
          {isInTrialPeriod
            ? `Periodo di prova (${trialDaysLeft} giorni rimanenti)`
            : `Abbonamento ${subscription?.plan_type === 'monthly' ? 'Mensile' : 'Annuale'} attivo`}
        </span>
      </div>
      {isInTrialPeriod && (
        <div className="mt-2 text-sm">
          Il tuo abbonamento diventerà attivo automaticamente al termine del periodo di prova.
        </div>
      )}
      <div className="mt-2 text-sm">
        Prossimo rinnovo: {subscription?.updated_at ? new Date(subscription.updated_at).toLocaleDateString('it-IT') : 'Non disponibile'}
      </div>
    </div>
  );
} 