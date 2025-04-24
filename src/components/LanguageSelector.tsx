'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/TranslationContext'

export default function LanguageSelector() {
  const { language, changeLanguage, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.language-selector')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  // Funzione per cambiare lingua
  const handleLanguageChange = (lang: 'en' | 'it' | 'es' | 'fr' | 'zh') => {
    changeLanguage(lang)
    setIsOpen(false)
  }

  // Ottieni il nome della lingua corrente
  const getLanguageName = () => {
    return t(`language_${language}`)
  }

  return (
    <div className="language-selector relative z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 bg-purple-100 text-[#5E2BFF] px-3 py-2 rounded-md hover:bg-purple-200 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{t('language')}: {getLanguageName()}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md py-1 border border-gray-200">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'en' ? 'bg-purple-50 text-[#5E2BFF]' : ''}`}
          >
            {t('language_en')}
          </button>
          <button
            onClick={() => handleLanguageChange('it')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'it' ? 'bg-purple-50 text-[#5E2BFF]' : ''}`}
          >
            {t('language_it')}
          </button>
          <button
            onClick={() => handleLanguageChange('es')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'es' ? 'bg-purple-50 text-[#5E2BFF]' : ''}`}
          >
            {t('language_es')}
          </button>
          <button
            onClick={() => handleLanguageChange('fr')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'fr' ? 'bg-purple-50 text-[#5E2BFF]' : ''}`}
          >
            {t('language_fr')}
          </button>
          <button
            onClick={() => handleLanguageChange('zh')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'zh' ? 'bg-purple-50 text-[#5E2BFF]' : ''}`}
          >
            {t('language_zh')}
          </button>
        </div>
      )}
    </div>
  )
} 