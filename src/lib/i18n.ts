import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Verifichiamo se i18n è già inizializzato per evitare reinizializzazioni
if (!i18n.isInitialized) {
  i18n
    // Carica le traduzioni utilizzando un backend http (per caricare risorse da public/locales)
    .use(Backend)
    // Rileva la lingua preferita dell'utente
    .use(LanguageDetector)
    // Integra con React
    .use(initReactI18next)
    // Inizializza i18next
    .init({
      // Lingua predefinita
      fallbackLng: 'en',
      // Disabilitiamo il debug in produzione
      debug: false,
      // Namespace predefinito
      defaultNS: 'common',
      // Opzioni di rilevamento lingua (prioritizzando localStorage)
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'language',
        caches: ['localStorage'],
      },
      // Configurazioni per il backend con limiti di caricamento per migliorare le prestazioni
      backend: {
        // Percorso per caricare le traduzioni
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        // Limitiamo il numero di richieste simultanee
        requestOptions: {
          mode: 'cors',
          credentials: 'same-origin',
          cache: 'default',
        },
        // Usiamo la cache per le traduzioni
        allowMultiLoading: false,
      },
      // Opzioni di interpolazione
      interpolation: {
        // React già fa l'escape dei valori per prevenire XSS
        escapeValue: false,
      },
      // Carica solo le lingue necessarie
      load: 'currentOnly',
      // Non precarica tutte le traduzioni, ma le carica on-demand
      preload: false,
    });
}

export default i18n; 