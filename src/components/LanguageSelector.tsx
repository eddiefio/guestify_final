import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const router = useRouter();
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  
  // Definisce le lingue supportate
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' }
  ];

  // Ottiene la lingua corrente dal localStorage o imposta 'en' come predefinito
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
  }, [i18n]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setCurrentLanguage(langCode);
    setIsOpen(false);
  };

  // Trova il nome della lingua corrente
  const currentLangName = languages.find(lang => lang.code === currentLanguage)?.name || 'English';

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        className="flex items-center text-white text-sm font-medium rounded-md bg-[#5E2BFF] hover:bg-purple-700 px-3 py-1.5 focus:outline-none"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-1">🌐</span>
        <span className="mx-1">{currentLangName}</span>
        <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          <div className="py-1" role="none">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentLanguage === lang.code ? 'bg-gray-100 text-[#5E2BFF] font-medium' : 'text-gray-700'
                } hover:bg-gray-50`}
                role="menuitem"
                onClick={() => changeLanguage(lang.code)}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 