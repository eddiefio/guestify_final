import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionPlans from "@/components/SubscriptionPlans";

export default async function SubscriptionPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Verifica se l'utente è autenticato
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Controlla se l'utente ha già un abbonamento attivo
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();
  
  // Se l'utente ha già un abbonamento attivo, reindirizzalo alla dashboard
  if (subscription) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Scegli il tuo piano</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-center mb-12 text-lg">
          Sblocca tutte le funzionalità premium di Guestify e gestisci i tuoi affitti brevi in modo professionale.
        </p>
        
        <SubscriptionPlans userId={session.user.id} />
      </div>
    </div>
  );
} 