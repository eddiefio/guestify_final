import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/settings';

type GuestLayoutProps = {
  children: React.ReactNode;
  params: {
    propertyId: string;
    locale?: string;
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function GuestLayout({ 
  children, 
  params: { propertyId, locale = 'en' } 
}: GuestLayoutProps) {
  // Validate that the locale is supported
  if (locale && !locales.includes(locale as any)) {
    notFound();
  }

  // Use the locale if provided
  if (locale) {
    unstable_setRequestLocale(locale);
  }

  // Get messages for the current locale
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    messages = (await import(`../../../messages/en.json`)).default;
  }

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );
} 