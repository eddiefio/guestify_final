/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'es', 'fr', 'zh'],
    localeDetection: true,
  },
  fallbackLng: {
    default: ['en'],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
  load: 'languageOnly',
  ns: ['common'],
  defaultNS: 'common',
  localePath: 
    typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
} 