import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Guestify - La piattaforma per gli host di affitti brevi',
  description: 'Guestify è un\'applicazione web che permette agli host di affitti brevi di integrare all\'interno del proprio appartamento una stampa con un QR code per offrire servizi extra ai propri ospiti.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
        {/* Font Awesome */}
        <Script
          src="https://kit.fontawesome.com/a076d05399.js"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
