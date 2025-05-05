"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

// Definisci le feature comuni a tutti i piani
const features = [
  "Crea QR code personalizzati",
  "Gestisci servizi extra",
  "Gestisci regole della casa",
  "Connessione WiFi automatica",
  "Guide personalizzate della città",
  "Gestione pagamenti ospiti",
  "Supporto tecnico",
];

// Componente per il piano
interface PlanProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  planType: "monthly" | "yearly";
  onSelectPlan: (planType: "monthly" | "yearly") => void;
  selected: boolean;
}

function Plan({
  title,
  price,
  period,
  features,
  planType,
  onSelectPlan,
  selected,
}: PlanProps) {
  return (
    <div
      className={`rounded-lg p-6 ${
        selected
          ? "border-2 border-[#5E2BFF] bg-[#5E2BFF]/5"
          : "border border-gray-200"
      }`}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="mt-4 mb-6">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-gray-600 ml-2">/{period}</span>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(planType)}
        className={`w-full py-2 px-4 rounded-md text-center ${
          selected
            ? "bg-[#5E2BFF] text-white"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        {selected ? "Piano selezionato" : "Seleziona piano"}
      </button>
    </div>
  );
}

interface SubscriptionPlansProps {
  userId: string;
}

export default function SubscriptionPlans({ userId }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Funzione per gestire la selezione del piano
  const handleSelectPlan = (planType: "monthly" | "yearly") => {
    setSelectedPlan(planType);
  };

  // Funzione per procedere al checkout con Stripe
  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/stripe/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: selectedPlan,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Errore durante la creazione del payment link");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Errore durante il checkout:", error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <Plan
          title="Abbonamento Mensile"
          price="€9,90"
          period="mese"
          features={features}
          planType="monthly"
          onSelectPlan={handleSelectPlan}
          selected={selectedPlan === "monthly"}
        />
        <Plan
          title="Abbonamento Annuale"
          price="€99,90"
          period="anno"
          features={[...features, "2 mesi gratuiti!"]}
          planType="yearly"
          onSelectPlan={handleSelectPlan}
          selected={selectedPlan === "yearly"}
        />
      </div>

      <div className="text-center">
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="bg-[#5E2BFF] hover:bg-[#4C24CB] text-white py-3 px-8 rounded-md font-bold text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Elaborazione..." : "Procedi al pagamento"}
        </button>
        <p className="mt-4 text-sm text-gray-600">
          Prova gratuita di 7 giorni. Annulla in qualsiasi momento.
        </p>
      </div>
    </div>
  );
} 