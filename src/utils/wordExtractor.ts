import type { Word } from '../types'

// Common German verb endings
const VERB_ENDINGS = ['en', 'st', 't', 'n', 'e', 'te', 'ten', 'test', 'tet', 'est', 'et']
// Common German noun patterns (capitalized words)
// German adjectives often end with these
const ADJECTIVE_ENDINGS = ['ig', 'lich', 'isch', 'bar', 'sam', 'los', 'voll', 'haft']

interface WordCandidate {
  word: string
  type: 'verb' | 'noun' | 'adjective'
  context: string
  sentence: string
}

export async function extractWords(text: string): Promise<Word[]> {
  // Clean and split text into sentences
  const sentences = text
    .replace(/[^\w\säöüÄÖÜß]/g, ' ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const wordMap = new Map<string, WordCandidate>()
  const words: WordCandidate[] = []

  // Extract potential words from sentences
  sentences.forEach(sentence => {
    const tokens = sentence
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && w.length < 20)

    tokens.forEach((token, index) => {
      const lowerToken = token.toLowerCase()
      const cleanToken = token.replace(/[^\wäöüÄÖÜß]/g, '')

      if (cleanToken.length < 3) return

      let type: 'verb' | 'noun' | 'adjective' | null = null

      // Check if it's a noun (capitalized in German)
      if (token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()) {
        type = 'noun'
      }
      // Check if it's a verb (common endings)
      else if (VERB_ENDINGS.some(ending => lowerToken.endsWith(ending))) {
        type = 'verb'
      }
      // Check if it's an adjective
      else if (ADJECTIVE_ENDINGS.some(ending => lowerToken.endsWith(ending))) {
        type = 'adjective'
      }

      if (type) {
        const key = cleanToken.toLowerCase()
        if (!wordMap.has(key)) {
          const candidate: WordCandidate = {
            word: cleanToken,
            type,
            context: sentence,
            sentence: getShortSentence(sentence, token)
          }
          wordMap.set(key, candidate)
          words.push(candidate)
        }
      }
    })
  })

  // Translate words (using a simple approach - in production, use a translation API)
  const translatedWords = await translateWords(words)

  return translatedWords
}

function getShortSentence(sentence: string, word: string): string {
  const words = sentence.split(/\s+/)
  const wordIndex = words.findIndex(w => w.toLowerCase().includes(word.toLowerCase()))
  
  if (wordIndex === -1) return sentence.substring(0, 50)

  const start = Math.max(0, wordIndex - 2)
  const end = Math.min(words.length, wordIndex + 3)
  const shortSentence = words.slice(start, end).join(' ')
  
  return shortSentence.length > 50 ? shortSentence.substring(0, 47) + '...' : shortSentence
}

async function translateWords(candidates: WordCandidate[]): Promise<Word[]> {
  // For now, we'll use a simple dictionary approach
  // In production, you'd want to use a translation API like Google Translate, DeepL, etc.
  const translations = new Map<string, string>()

  // Try to translate using a simple approach
  // Note: This is a placeholder - you'll need to integrate with a translation service
  const words: Word[] = []

  for (const candidate of candidates.slice(0, 50)) { // Limit to 50 words for now
    const translation = await translateWord(candidate.word)
    if (translation) {
      words.push({
        german: candidate.word,
        english: translation,
        type: candidate.type,
        example: candidate.sentence,
        context: candidate.context
      })
    }
  }

  return words
}

async function translateWord(word: string): Promise<string | null> {
  // Try multiple translation APIs as fallback
  const apis = [
    // LibreTranslate public instance
    async () => {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: word,
          source: 'de',
          target: 'en',
          format: 'text'
        })
      })
      if (response.ok) {
        const data = await response.json()
        return data.translatedText
      }
      return null
    },
    // MyMemory Translation API (free tier)
    async () => {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=de|en`
      )
      if (response.ok) {
        const data = await response.json()
        return data.responseData?.translatedText
      }
      return null
    }
  ]

  for (const api of apis) {
    try {
      const translation = await api()
      if (translation && translation !== word && translation.length > 0) {
        return translation
      }
    } catch (error) {
      console.warn('Translation API failed:', error)
      continue
    }
  }

  // Fallback: return the word itself (capitalize first letter for better display)
  // This is better than showing brackets
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

