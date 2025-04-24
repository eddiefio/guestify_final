/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  debug: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'es', 'fr', 'zh'],
  },
  /** Per caricare le traduzioni anche sul client */
  returnNull: false,
  defaultNS: 'common',
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales') 
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
} 