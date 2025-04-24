'use client'

import { useState, useEffect } from 'react'
import { useDynamicTranslation } from '@/contexts/TranslationContext'

interface DynamicTranslatedContentProps {
  content: string
  type?: 'text' | 'html'
}

export default function DynamicTranslatedContent({ content, type = 'text' }: DynamicTranslatedContentProps) {
  const { translateText, isTranslating, currentLanguage } = useDynamicTranslation()
  const [translatedContent, setTranslatedContent] = useState(content)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTranslation = async () => {
      setIsLoading(true)
      try {
        // Traduci il contenuto solo se la lingua non è inglese (default)
        if (currentLanguage !== 'en') {
          const translated = await translateText(content)
          setTranslatedContent(translated)
        } else {
          setTranslatedContent(content)
        }
      } catch (error) {
        console.error('Errore durante la traduzione:', error)
        setTranslatedContent(content) // In caso di errore, usa il contenuto originale
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranslation()
  }, [content, currentLanguage, translateText])

  if (isLoading || isTranslating) {
    return <div className="animate-pulse bg-gray-100 rounded h-4 w-full"></div>
  }

  if (type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
  }

  return <div>{translatedContent}</div>
} 