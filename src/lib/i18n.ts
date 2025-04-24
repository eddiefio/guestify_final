'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Verifica se siamo in un ambiente browser
const isBrowser = typeof window !== 'undefined';

// Crea una funzione per inizializzare i18n
const initI18n = () => {
  if (!isBrowser) {
    return i18n; // Durante SSR, restituisci solo l'oggetto base
  }

  if (!i18n.isInitialized) {
    i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'it', 'es', 'fr', 'zh'],
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['path', 'localStorage', 'navigator'],
          caches: ['localStorage'],
        },
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
      })
      .catch(error => {
        if (isBrowser) console.error('Error initializing i18n:', error);
      });
  }

  return i18n;
};

// Esporta l'istanza di i18n
export default isBrowser ? initI18n() : i18n; 