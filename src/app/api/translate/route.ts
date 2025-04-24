import { NextResponse } from 'next/server'

// Questo è un semplice mock di servizio di traduzione
// In un ambiente di produzione, sostituire con un vero servizio di traduzione come Google Translate API
async function mockTranslate(text: string, targetLanguage: string): Promise<string> {
  // In un'implementazione reale chiameremmo un'API di traduzione esterna
  // Per ora restituiamo solo il testo originale
  console.log(`Mock translation of "${text}" to ${targetLanguage}`)
  return text
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json()
    
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters: text and targetLanguage' },
        { status: 400 }
      )
    }
    
    // Verifica se la lingua di destinazione è supportata
    const supportedLanguages = ['en', 'it', 'es', 'fr', 'zh']
    if (!supportedLanguages.includes(targetLanguage)) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLanguage}` },
        { status: 400 }
      )
    }
    
    const translatedText = await mockTranslate(text, targetLanguage)
    
    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    )
  }
} 