'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { useEffect } from 'react'

export default function Providers({
  children,
  locale = 'en'
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  // Aggiorna la lingua solo quando il componente monta o la lingua cambia
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale).catch(err => {
        console.error('Error changing language:', err);
      });
    }
  }, [locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        {children}
        <Toaster position="top-center" />
      </AuthProvider>
    </I18nextProvider>
  )
}