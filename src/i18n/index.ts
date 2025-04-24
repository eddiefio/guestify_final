import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from './settings';

export default getRequestConfig(async ({locale}) => {
  // Verifica che la lingua richiesta sia supportata
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
}); 