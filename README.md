## ***DESCRIZIONE***

Guestify è un'applicazione web che permette agli host di afitti brevi ( Airbnb, booking ecc.) di integrare all'interno 
del proprio appartamento una stampa con all'inerno un QR code che se scannerizzato dagli ospiti apparrirà loro
una pagina con all'interno : Servizi Extra, Regole della casa, Connessione al Wifi Auotomatica, Guida dlla città dell'host

## ***COME FUNZIONA***

2 Divisioni fondamentali dell'app:
Host e Guest

Visualizzazioni :

Host :
- Gli host accederanno alla dashboard tramite registrazione e si presenterà loro davanti:
- La lista delle proprietà che hanno aggiunto, visualizzate come card (che potranno aggiungere, modificare o eliminare).
All'interno delle card si troveranno 5 toggle : 
- QR code : pagina per scaricare e stampare il pdf del qr code da inserire nell'appartamento. Ogni appartamento, anche se dello stesso utente, ha un QR code personalizzato.
- Extra Services : lista di servizi a pagamento che l'host vuole proporre agli ospiti, ogni servizio è singolo
- House Rules : lista di regole della casa personalizzabili dall'host, ogni regola è singola, non un unico file di testo.
- Wifi Passsword : inserimento del nome del wifi  e della password per poter far connettere in automatico gli ospiti.
- Host City Guide : possibilità da parte dell'host di caricare unaguida pdf della città.

Guest :
- Non hanno bisogno di una fase di registrazione ma accederanno alla pagina direttamente scannerizzando il QR code.
- Scannerizzato il QR si troveranno dvanti una pagina con 4 Toggle che vanno a coprire tutta la pagina
a quadrato : QR code, Extra Services, House Rules, Host City Guide.
- Potranno pagare i servizi extra direttamente dall'app tramite un carrello e una pagina di checkout.


## MODALITÀ DI GUADAGNO

Guestify guadagna il 12% su ogni di Extra Services da parte degli ospiti 
Gli host guadagnano il prezzo che hanno messo per gli Extra Services

## BRAND IDENTITY e STILE APP

App web ottimizzata per l'uso mobile.
Design moderno e simile ad app come Airbnb, Spotify ecc.

Il font per le scritte dell'app deve essere Leaugue Spartan Medium,
Per i Pulsanti e i titoli deve essere League Spartan Bold.

Colore principale #5E2BFF
Colore Secondario ##ffde59

## LATO TECNICO

L'applicazione è sviluppata in Next.js React, usa Supabase come database e Vercel per l’hosting.

Per la gestione Auth si appoggia a Supabase, anche per l'invio di mail AUth.

Come Email SMTP uso la personal mail di mailcheap.com (stesso servizio del dominio) che è "noreply@guestify.shop"

Gestione dei pagamenti tramite Stripe, creazione da parte degli host di un profilo Stripe standard per gestire i pagamenti.
Tasse di Stripe applicate solo sulla parte di Guestify, gli store ricevono compenso completo.

L'url dell'app è https://app.guestify.shop