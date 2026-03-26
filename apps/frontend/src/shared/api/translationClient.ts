// utils/translation.ts
// Reusable translation function for translating German words to English
import { apiPost } from './httpClient'

export async function translateWord(word: string): Promise<string | null> {
  try {
    const response = await apiPost<{ translations: string[] }>('/api/v1/translate/batch', {
      words: [word]
    })
    const translated = response.translations?.[0]
    if (translated) return translated
  } catch {
    // Fall back to browser API chain
  }

  // Try multiple translation APIs as fallback
  const apis = [
    // LibreTranslate public instance
    async () => {
      try {
        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: word,
            source: 'de',
            target: 'en',
            format: 'text'
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        if (response.ok) {
          const data = await response.json()
          const translation = data.translatedText?.trim()
          if (translation && translation !== word && translation.length > 0) {
            return translation
          }
        }
      } catch (error) {
        // Silently fail and try next API
      }
      return null
    },
    // MyMemory Translation API (free tier)
    async () => {
      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=de|en`,
          { signal: AbortSignal.timeout(10000) }
        )
        if (response.ok) {
          const data = await response.json()
          const translation = data.responseData?.translatedText?.trim()
          if (translation && translation !== word && translation.length > 0) {
            return translation
          }
        }
      } catch (error) {
        // Silently fail and try next API
      }
      return null
    },
    // Google Translate (unofficial, via public API)
    async () => {
      try {
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=en&dt=t&q=${encodeURIComponent(word)}`,
          { signal: AbortSignal.timeout(10000) }
        )
        if (response.ok) {
          const data = await response.json()
          const translation = data[0]?.[0]?.[0]?.trim()
          if (translation && translation !== word && translation.length > 0) {
            return translation
          }
        }
      } catch (error) {
        // Silently fail and try next API
      }
      return null
    },
    // Alternative LibreTranslate instance
    async () => {
      try {
        const response = await fetch('https://translate.argosopentech.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: word,
            source: 'de',
            target: 'en',
            format: 'text'
          }),
          signal: AbortSignal.timeout(10000)
        })
        if (response.ok) {
          const data = await response.json()
          const translation = data.translatedText?.trim()
          if (translation && translation !== word && translation.length > 0) {
            return translation
          }
        }
      } catch (error) {
        // Silently fail
      }
      return null
    }
  ]

  // Try each API in sequence
  for (const api of apis) {
    try {
      const translation = await api()
      if (translation) {
        return translation
      }
      // Small delay between API attempts
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      continue
    }
  }

  return null
}

