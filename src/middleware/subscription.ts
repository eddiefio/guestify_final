import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function requireSubscription(req: NextRequest) {
  // Crea un client Supabase per il middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Ottieni la sessione utente
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se l'utente non è autenticato, reindirizzalo alla pagina di login
  if (!session) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Verifica se l'utente ha un abbonamento attivo
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", session.user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Se l'utente non ha un abbonamento attivo, reindirizzalo alla pagina di sottoscrizione
  if (!subscription) {
    return NextResponse.redirect(new URL("/subscription", req.url));
  }

  return res;
} 