import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultResources } from './i18n-resources';

// Inizializza i18next con le configurazioni necessarie
i18n
  // Carica le traduzioni utilizzando un backend http (per caricare risorse da public/locales)
  .use(Backend)
  // Rileva la lingua preferita dell'utente
  .use(LanguageDetector)
  // Integra con React
  .use(initReactI18next)
  // Inizializza i18next
  .init({
    // Risorse predefinite caricate subito
    resources: defaultResources,
    // Lingua predefinita
    fallbackLng: 'en',
    // Disabilita la modalità di debug in produzione
    debug: false,
    // Namespace predefinito
    defaultNS: 'common',
    // Opzioni di rilevamento lingua (prioritizzando localStorage)
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
    // Configurazioni per il backend
    backend: {
      // Percorso per caricare le traduzioni
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Riduce il timeout per evitare blocchi
      requestOptions: {
        timeout: 3000 // 3 secondi di timeout
      }
    },
    // Opzioni di interpolazione
    interpolation: {
      // React già fa l'escape dei valori per prevenire XSS
      escapeValue: false,
    },
    // Strategia di fallback in caso di errore
    partialBundledLanguages: true,
    load: 'languageOnly', // Carica solo la lingua base (en invece di en-US)
    // Non bloccare l'UI se le traduzioni non sono disponibili
    react: {
      useSuspense: false
    }
  }).catch(error => console.error('i18n initialization error:', error));

// Precarica la lingua inglese per evitare ritardi
i18n.loadLanguages('en');

export default i18n; 