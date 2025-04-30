# Configurazione di Apple Pay per Stripe in Guestify

Questa guida spiega come configurare correttamente Apple Pay con Stripe nella tua applicazione Guestify.

## Prerequisiti

1. Un account Stripe attivo
2. Un dominio con SSL (HTTPS)
3. Un account sviluppatore Apple (per la produzione)

## Passaggi per la configurazione

### 1. Verifica dei requisiti di dominio

Apple Pay richiede che il tuo dominio sia verificato prima di poter essere utilizzato con Apple Pay. Segui questi passaggi per verificare il tuo dominio:

1. Accedi al [Dashboard di Stripe](https://dashboard.stripe.com/)
2. Vai su **Impostazioni** > **Pagamento con portafogli** > **Apple Pay**
3. Aggiungi il tuo dominio all'elenco dei domini verificati
4. Stripe ti fornirà un file di verifica del dominio che dovrai caricare nel tuo server

### 2. Caricamento del file di verifica del dominio

1. Scarica il file di verifica fornito da Stripe (`.well-known/apple-developer-merchantid-domain-association`)
2. Carica questo file nella directory `.well-known` del tuo server web
3. Assicurati che il file sia accessibile all'URL: `https://tuodominio.com/.well-known/apple-developer-merchantid-domain-association`
4. Torna al Dashboard di Stripe e clicca su "Verifica"

### 3. Configurazione in ambiente di sviluppo

Per testare Apple Pay in ambiente di sviluppo:

1. Se stai sviluppando localmente, puoi usare il tunnel ngrok per esporre una porta locale:
   ```
   ngrok http 3000
   ```

2. Usa l'URL ngrok (es. `https://a1b2c3d4.ngrok.io`) come dominio per la verifica in Stripe

3. Carica il file di verifica anche nell'ambiente locale:
   - Crea una cartella `.well-known` nella directory `public` del tuo progetto Next.js
   - Inserisci il file `apple-developer-merchantid-domain-association` scaricato da Stripe

### 4. Test di Apple Pay

Per testare Apple Pay:

1. Usa un dispositivo Apple compatibile (iPhone, iPad o Mac con Touch ID)
2. Assicurati di avere configurato almeno una carta in Apple Wallet
3. Accedi al tuo sito tramite Safari (importante: Apple Pay funziona solo in Safari)
4. Prova a effettuare un acquisto con il pulsante Apple Pay

### 5. Risoluzione dei problemi comuni

Se Apple Pay non appare o non funziona:

1. **Il browser non è Safari**: Apple Pay funziona solo in Safari
2. **Dispositivo non supportato**: Assicurati di utilizzare un dispositivo Apple compatibile
3. **Dominio non verificato**: Controlla che il dominio sia stato verificato correttamente in Stripe
4. **HTTPS non configurato**: Apple Pay richiede HTTPS
5. **Portafoglio non configurato**: Assicurati di avere almeno una carta configurata in Apple Wallet
6. **Ambiente di test**: In ambiente di test, Stripe mostrerà Apple Pay solo se disponibile sul dispositivo

### 6. Differenze tra sviluppo e produzione

In produzione:

1. Saranno necessarie credenziali di produzione di Stripe
2. Il tuo dominio di produzione deve essere verificato
3. Per accettare Apple Pay in app iOS native, è necessario un certificato Apple Pay merchant identity specifico

## Integrazione di codice

Nel nostro codice:

1. Usiamo il componente `ApplePayButton.tsx` per gestire il pulsante Apple Pay personalizzato
2. Il pulsante apparirà automaticamente solo sui dispositivi compatibili
3. La logica per verificare la disponibilità di Apple Pay è implementata nel componente stesso

## Ulteriori risorse

- [Documentazione Stripe per Apple Pay](https://stripe.com/docs/apple-pay)
- [Guida alla verifica del dominio di Apple Pay](https://stripe.com/docs/apple-pay/web/v3#going-live)
- [Test di Apple Pay in ambiente di sviluppo](https://stripe.com/docs/testing#apple-pay-android-pay) 