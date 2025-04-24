import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

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
    // Lingua predefinita
    fallbackLng: 'en',
    // Abilita la modalità di debug in sviluppo
    debug: process.env.NODE_ENV === 'development',
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
    },
    // Opzioni di interpolazione
    interpolation: {
      // React già fa l'escape dei valori per prevenire XSS
      escapeValue: false,
    },
  });

export default i18n; 