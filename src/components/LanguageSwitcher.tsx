'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/i18n/settings';

export default function LanguageSwitcher() {
  const t = useTranslations('GuestView.Header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Map delle etichette delle lingue
  const languageLabels: Record<string, string> = {
    en: t('English'),
    it: t('Italian'),
    es: t('Spanish'),
    fr: t('French'),
    zh: t('Chinese')
  };

  // Funzione per cambiare lingua
  const handleLocaleChange = (newLocale: string) => {
    // Chiudi il dropdown
    setIsOpen(false);
    
    // Ottieni il pathname corrente (es: /guest/123)
    let newPath = pathname;
    
    // Se il pathname inizia con la locale corrente, rimuovila
    if (pathname.startsWith(`/${locale}/`)) {
      newPath = pathname.replace(`/${locale}`, '');
    } else if (pathname.startsWith(`/${locale}`)) {
      newPath = pathname.replace(`/${locale}`, '');
    }
    
    // Se il nuovo locale è quello predefinito (en), non aggiungere il prefisso
    if (newLocale === 'en') {
      router.push(newPath);
    } else {
      // Altrimenti aggiungi il prefisso della nuova locale
      router.push(`/${newLocale}${newPath}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium px-3 py-2 rounded-md bg-white/20 hover:bg-white/30"
      >
        <span>{t('LanguageSelector')}: {languageLabels[locale]}</span>
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  locale === loc ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                {languageLabels[loc]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 