'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  useEffect(() => {
    // Determine current language from i18n, URL or localStorage
    const currentLocale = i18n.language || 'en';
    
    const detectedLanguage = languages.find(
      (lang) => lang.code === currentLocale
    ) || languages[0]; // Default to English
    
    setCurrentLanguage(detectedLanguage);
  }, [i18n.language]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const changeLanguage = async (language: Language) => {
    if (language.code === currentLanguage?.code) {
      setIsOpen(false);
      return;
    }

    // Change language in i18next
    await i18n.changeLanguage(language.code);
    
    // Save selected language to localStorage
    localStorage.setItem('language', language.code);
    setCurrentLanguage(language);
    setIsOpen(false);
  };

  if (!currentLanguage) return null;

  return (
    <div className="relative inline-block text-left z-50">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-sm font-medium text-[#5E2BFF] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t('language')}
      >
        <span className="mr-1">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentLanguage.code === language.code
                    ? 'bg-gray-100 text-[#5E2BFF] font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => changeLanguage(language)}
                role="menuitem"
              >
                <span className="mr-2">{language.flag}</span>
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 