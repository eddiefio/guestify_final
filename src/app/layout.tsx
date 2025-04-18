import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
