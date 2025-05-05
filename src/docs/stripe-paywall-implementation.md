# Implementazione Paywall con Stripe in Guestify

Questa documentazione descrive l'implementazione del paywall con Stripe in Guestify per gestire abbonamenti mensili (€9,90) e annuali (€99,90) con un periodo di prova di 7 giorni.

## Struttura del Database

È stata creata una tabella `subscriptions` in Supabase con i seguenti campi:

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'incomplete', 'incomplete_expired')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  price NUMERIC NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Endpoints API

### 1. API Create Payment Link

L'endpoint `src/app/api/stripe/create-payment-link/route.ts` crea un link di pagamento di Stripe per l'abbonamento mensile o annuale. Quando un utente seleziona un piano e fa clic su "Procedi al pagamento", viene chiamato questo endpoint.

### 2. API Webhook

L'endpoint `src/app/api/webhooks/stripe/route.ts` gestisce gli eventi di Stripe come pagamenti riusciti, aggiornamenti delle sottoscrizioni, ecc. Questo endpoint è cruciale per mantenere sincronizzato lo stato dell'abbonamento nel database con lo stato in Stripe.

## Componenti UI

### 1. Pagina Sottoscrizione

La pagina `src/app/subscription/page.tsx` mostra le opzioni di abbonamento disponibili. Se un utente ha già un abbonamento attivo, viene reindirizzato alla dashboard.

### 2. Componente Piani di Sottoscrizione

Il componente `src/components/SubscriptionPlans.tsx` visualizza i piani di abbonamento disponibili con i relativi prezzi e caratteristiche. Gli utenti possono selezionare un piano e procedere al pagamento.

### 3. Componente Stato Sottoscrizione

Il componente `src/components/SubscriptionStatus.tsx` mostra lo stato dell'abbonamento dell'utente, incluse informazioni sul periodo di prova e sulla data di rinnovo.

## Hooks e Middleware

### 1. Hook useSubscription

Il hook `src/hooks/useSubscription.ts` fornisce funzionalità per verificare lo stato dell'abbonamento dell'utente, se è nel periodo di prova, e quanti giorni rimangono del periodo di prova.

### 2. Middleware Sottoscrizione

Il middleware `src/middleware/subscription.ts` verifica se l'utente ha un abbonamento attivo e lo reindirizza alla pagina di sottoscrizione se necessario.

### 3. Middleware principale

Il middleware principale `src/middleware.ts` è stato aggiornato per includere la verifica dell'abbonamento per le pagine della dashboard.

## Configurazione Stripe

Per implementare il paywall, è necessario configurare i seguenti elementi in Stripe:

1. **Prodotti e Prezzi:**
   - Creare un prodotto per l'abbonamento
   - Creare due prezzi: uno mensile (€9,90) e uno annuale (€99,90)

2. **Webhook:**
   - Configurare un webhook in Stripe che punti a `https://your-domain.com/api/webhooks/stripe`
   - Eventi da monitorare: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Variabili d'Ambiente

Le seguenti variabili d'ambiente sono necessarie:

```
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Abbonamenti
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id

# URL del sito
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Flusso di Abbonamento

1. L'utente visita la pagina `/subscription`
2. Seleziona un piano (mensile o annuale)
3. Fa clic su "Procedi al pagamento"
4. Viene reindirizzato alla pagina di checkout di Stripe
5. Completa il pagamento con Stripe
6. Viene reindirizzato alla dashboard
7. Stripe invia un evento webhook all'endpoint `/api/webhooks/stripe`
8. L'endpoint webhook aggiorna lo stato dell'abbonamento nel database

## Note Importanti

- Il periodo di prova di 7 giorni è configurato nella chiamata API a Stripe
- Il middleware di sottoscrizione protegge le pagine della dashboard e reindirizza gli utenti alla pagina di sottoscrizione se necessario
- Il componente di stato della sottoscrizione mostra informazioni sul periodo di prova e sulla data di rinnovo 