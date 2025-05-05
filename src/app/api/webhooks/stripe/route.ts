import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Disabilita il body parser integrato in Next.js per ricevere il raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Funzione per leggere il corpo della richiesta come stringa
async function readBody(readable: ReadableStream): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];

  const reader = readable.getReader();
  let done = false;
  
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      chunks.push(value);
    }
  }

  return decoder.decode(chunks.length === 1 ? chunks[0] : Buffer.concat(chunks));
}

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2023-10-16",
    });
    
    // Recupera la signature dell'header
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json(
        { error: "Manca la signature di Stripe" },
        { status: 400 }
      );
    }
    
    // Leggi il corpo della richiesta
    const body = await readBody(req.body as ReadableStream);
    
    // Verifica l'evento
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret non configurato" },
        { status: 500 }
      );
    }
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`❌ Errore di verifica della webhook signature: ${err}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Errore sconosciuto'}` },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Gestisci diversi tipi di eventi
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Assicurati che questa sia una sessione di pagamento per un abbonamento
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          // Ottieni i dettagli dell'abbonamento
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Ottieni i dettagli del prezzo dall'abbonamento
          const priceId = subscription.items.data[0].price.id;
          const price = subscription.items.data[0].price;
          const userId = session.metadata?.user_id;
          
          if (!userId) {
            console.error('Nessun user_id trovato nei metadati della sessione');
            break;
          }
          
          // Determina il tipo di piano in base ai metadati o al prezzo
          const planType = session.metadata?.plan_type || 
                          (price.recurring?.interval === 'year' ? 'yearly' : 'monthly');
          
          // Salva o aggiorna la sottoscrizione nel database
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              status: subscription.status,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              stripe_price_id: priceId,
              plan_type: planType,
              price: price.unit_amount ? price.unit_amount / 100 : 0,
              interval: price.recurring?.interval || 'month',
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              updated_at: new Date().toISOString(),
            });
          
          if (error) {
            console.error('Errore durante il salvataggio della sottoscrizione:', error);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Aggiorna lo stato dell'abbonamento
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('Errore durante l\'aggiornamento della sottoscrizione:', error);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Aggiorna lo stato dell'abbonamento a 'canceled'
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('Errore durante la cancellazione della sottoscrizione:', error);
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Errore durante la gestione del webhook:', error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
} 