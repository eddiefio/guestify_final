import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Carica traduzioni usando xhr
  .use(Backend)
  // Rileva la lingua del browser
  .use(LanguageDetector)
  // Passa il modulo i18n a react-i18next
  .use(initReactI18next)
  // Inizializza i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'it', 'es', 'fr', 'zh'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // non necessario per React
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n; 