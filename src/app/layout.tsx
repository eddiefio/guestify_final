import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import Script from 'next/script'
import '../lib/i18n' // Importa la configurazione i18n

export const metadata: Metadata = {
  title: 'Guestify - La piattaforma per gli host di affitti brevi',
  description: 'Guestify è un\'applicazione web che permette agli host di affitti brevi di integrare all\'interno del proprio appartamento una stampa con un QR code per offrire servizi extra ai propri ospiti.',
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: { locale?: string };
}) {
  const locale = params?.locale || 'en';
  
  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers locale={locale}>
          {children}
        </Providers>
        {/* Font Awesome */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js"
          integrity="sha512-yFjZbTYRCJodnuyGlsKamNE/LlEaEAxSUDe5+u61mV8zzqJVFOH7TnULE2/PP/l5vKWpUNnF4VGVkXh3MjgLsg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </body>
    </html>
  )
}
