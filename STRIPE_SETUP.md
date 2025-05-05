# Configurazione del Paywall con Stripe

Questo documento spiega come configurare il sistema di pagamento per Guestify utilizzando Stripe Payment Links e webhooks.

## Prerequisiti

1. Un account Stripe (puoi crearne uno su [stripe.com](https://stripe.com))
2. Accesso alle chiavi API di Stripe
3. Un account Supabase con il database configurato

## Procedura di configurazione

### 1. Configurare le variabili d'ambiente

Crea un file `.env.local` nella root del progetto con le seguenti variabili:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Stripe Product Price IDs
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id_here

# Site URL (usato per i webhook e i redirect)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Creare i prodotti e i prezzi in Stripe

1. Accedi al dashboard di Stripe
2. Vai alla sezione "Prodotti" e crea i seguenti prodotti:

   #### Piano mensile di Guestify:
   - Nome: "Guestify Piano Mensile"
   - Prezzo: €9,90
   - Fatturazione: Ricorrente, mensile
   - Nota: dopo aver creato il prodotto, copia il `Price ID` (qualcosa come `price_1AbCdEfGhIjKlMnO`) e inseriscilo come `STRIPE_MONTHLY_PRICE_ID` nel file `.env.local`

   #### Piano annuale di Guestify:
   - Nome: "Guestify Piano Annuale"
   - Prezzo: €99,90
   - Fatturazione: Ricorrente, annuale
   - Nota: dopo aver creato il prodotto, copia il `Price ID` (qualcosa come `price_1AbCdEfGhIjKlMnO`) e inseriscilo come `STRIPE_YEARLY_PRICE_ID` nel file `.env.local`

### 3. Configurare il webhook di Stripe

1. Nel dashboard di Stripe, vai alla sezione "Developers" > "Webhooks"
2. Clicca su "Add endpoint"
3. Inserisci l'URL del webhook: `https://il_tuo_dominio.com/api/webhooks/stripe`
4. Seleziona gli eventi da ricevere:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. Clicca su "Add endpoint" per salvare
6. Copia il "Signing Secret" fornito da Stripe e inseriscilo come `STRIPE_WEBHOOK_SECRET` nel file `.env.local`

### 4. Testare il webhook in locale

Per testare il webhook in locale, puoi utilizzare la CLI di Stripe:

1. Installa la CLI di Stripe (se non l'hai già fatto)
2. Esegui il comando:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Stripe fornirà un webhook signing secret temporaneo che puoi usare per i test locali

### 5. Verifica del funzionamento

1. Avvia l'applicazione in locale
2. Accedi con un utente registrato
3. Vai alla pagina `/subscription`
4. Prova a sottoscrivere un piano
5. Verifica che:
   - Stripe crei correttamente la sessione di pagamento
   - L'utente venga reindirizzato alla pagina di Stripe per il pagamento
   - Dopo il pagamento, il webhook riceva l'evento e aggiorni il database
   - L'utente abbia accesso alle funzionalità riservate agli abbonati

## Note importanti

1. In modalità test, puoi utilizzare la carta di credito di test `4242 4242 4242 4242` con qualsiasi data di scadenza futura e qualsiasi CVC.
2. Ricorda di cambiare le chiavi API di Stripe in modalità "live" quando l'app è pronta per la produzione.
3. Il sistema include un periodo di prova gratuito di 7 giorni, come specificato nel README.
4. Durante il periodo di prova, l'utente ha accesso completo alle funzionalità a pagamento.

## Tabella delle sottoscrizioni nel database

La tabella `subscriptions` traccia lo stato degli abbonamenti degli utenti:

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'incomplete', 'incomplete_expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  trial_ends_at TIMESTAMPTZ,
  price DECIMAL NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

I campi principali sono:
- `user_id`: ID dell'utente in Supabase
- `status`: Stato dell'abbonamento ('active', 'trialing', 'canceled', ecc.)
- `stripe_subscription_id`: ID dell'abbonamento in Stripe
- `plan_type`: Tipo di piano ('monthly' o 'yearly')
- `trial_ends_at`: Data di fine della prova gratuita 