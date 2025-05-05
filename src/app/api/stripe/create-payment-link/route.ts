import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    // Inizializza il client Stripe con la chiave segreta
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      
    });

    // Ottieni la sessione utente corrente
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Utente non autenticato" },
        { status: 401 }
      );
    }

    const { planType } = await req.json();

    // Determina quale prezzo utilizzare in base al tipo di piano
    let priceId;
    if (planType === "monthly") {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    } else if (planType === "yearly") {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID;
    } else {
      return NextResponse.json(
        { error: "Tipo di piano non valido" },
        { status: 400 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "ID del prezzo non configurato" },
        { status: 500 }
      );
    }

    // Crea un customer per l'utente se non esiste già
    let customerId;
    const { data: existingCustomers } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .single();

    if (existingCustomers?.stripe_customer_id) {
      customerId = existingCustomers.stripe_customer_id;
    } else {
      // Crea un nuovo customer in Stripe
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // Crea una sessione di checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`,
      subscription_data: {
        trial_period_days: 7, // Periodo di prova di 7 giorni
      },
      metadata: {
        user_id: session.user.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Errore durante la creazione del payment link:", error);
    return NextResponse.json(
      { error: "Errore durante la creazione del payment link" },
      { status: 500 }
    );
  }
} 