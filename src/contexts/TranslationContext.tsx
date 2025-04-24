'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import i18next, { i18n } from 'i18next'
import { initReactI18next, useTranslation as useTranslationOriginal } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

// Tipi per il contesto
type Language = 'en' | 'it' | 'es' | 'fr' | 'zh'
type TranslationContextType = {
  language: Language
  changeLanguage: (lang: Language) => void
  i18n: i18n | null
  t: (key: string, options?: any) => string
}

// Creazione del contesto
const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  changeLanguage: () => {},
  i18n: null,
  t: (key: string) => key,
})

// Inizializzazione di i18next
const i18nInstance = i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'it', 'es', 'fr', 'zh'],
    ns: ['common'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

// Provider del contesto
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const router = useRouter()
  const pathname = usePathname()
  const { t, i18n } = useTranslationOriginal()

  // Funzione per cambiare la lingua
  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    
    // Salva la preferenza della lingua nel localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang)
    }
  }

  // Carica la lingua preferita dal localStorage all'avvio
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language
    if (savedLanguage && ['en', 'it', 'es', 'fr', 'zh'].includes(savedLanguage)) {
      changeLanguage(savedLanguage)
    } else {
      // Se non è presente una lingua salvata, usa quella del browser
      const browserLang = navigator.language.split('-')[0] as Language
      const supportedLang = ['en', 'it', 'es', 'fr', 'zh'].includes(browserLang) ? browserLang : 'en'
      changeLanguage(supportedLang)
    }
  }, [])

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, i18n, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook per utilizzare il contesto di traduzione
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation deve essere utilizzato all\'interno di un TranslationProvider')
  }
  return context
}

// Cache per le traduzioni dinamiche per migliorare le prestazioni
const translationCache: Record<string, Record<string, string>> = {}

// Hook per tradurre dinamicamente i contenuti personalizzati
export function useDynamicTranslation() {
  const { language } = useTranslation()
  const [isTranslating, setIsTranslating] = useState(false)
  
  // Funzione per tradurre dinamicamente un testo
  const translateText = async (text: string): Promise<string> => {
    // Se la lingua è inglese (default), ritorna il testo originale
    if (language === 'en') {
      return text
    }
    
    // Verifica se la traduzione è già in cache
    if (translationCache[text] && translationCache[text][language]) {
      return translationCache[text][language]
    }
    
    setIsTranslating(true)
    
    try {
      // Chiama l'API di traduzione
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: language,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Errore nella traduzione')
      }
      
      const { translatedText } = await response.json()
      
      // Salva in cache la traduzione
      if (!translationCache[text]) {
        translationCache[text] = {}
      }
      translationCache[text][language] = translatedText
      
      return translatedText
    } catch (error) {
      console.error('Errore durante la traduzione:', error)
      return text // In caso di errore, ritorna il testo originale
    } finally {
      setIsTranslating(false)
    }
  }
  
  // Funzione per tradurre un array di testi
  const translateTexts = async (texts: string[]): Promise<string[]> => {
    return Promise.all(texts.map(text => translateText(text)))
  }
  
  // Funzione per tradurre un oggetto con testi
  const translateObject = async <T extends Record<string, any>>(obj: T): Promise<T> => {
    const result = { ...obj }
    
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = await translateText(result[key] as string) as any
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = await translateObject(result[key]) as any
      }
    }
    
    return result
  }
  
  return {
    translateText,
    translateTexts,
    translateObject,
    isTranslating,
    currentLanguage: language
  }
} 