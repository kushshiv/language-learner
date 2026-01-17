import type { Sentence, Word } from '../types'

export interface SentenceData {
  original: string
  translation: string
  words: Array<{
    word: string
    startIndex: number
    endIndex: number
    translation?: string
  }>
}

export async function extractSentences(text: string, wordDictionary: Map<string, Word>): Promise<Sentence[]> {
  // Split text into sentences (preserve punctuation)
  const sentenceRegex = /([.!?]+[\s\n]|[\n]{2,})/
  const rawSentences = text
    .split(sentenceRegex)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 500) // Filter reasonable sentence lengths

  const sentences: Sentence[] = []

  for (let i = 0; i < rawSentences.length; i++) {
    const original = rawSentences[i]
    if (!original || original.length < 5) continue

    // Extract words from this sentence
    const words = extractWordsFromSentence(original, wordDictionary)
    
    // Translate the whole sentence
    const translation = await translateSentence(original)

    sentences.push({
      original,
      translation,
      words,
      index: i
    })
  }

  return sentences
}

function extractWordsFromSentence(sentence: string, wordDictionary: Map<string, Word>): Word[] {
  const words: Word[] = []
  const foundWords = new Set<string>() // Avoid duplicates
  
  // Split by whitespace and punctuation
  const tokens = sentence.split(/\s+/)
  
  for (const token of tokens) {
    const cleanToken = token.replace(/[^\wäöüÄÖÜß]/g, '').toLowerCase()
    if (cleanToken.length < 3) continue

    // Check if we have this word in our dictionary
    const word = wordDictionary.get(cleanToken)
    if (word && !foundWords.has(cleanToken)) {
      words.push(word)
      foundWords.add(cleanToken)
    }
  }

  return words
}

async function translateSentence(sentence: string): Promise<string> {
  // Try multiple translation APIs
  const apis = [
    async () => {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: sentence,
          source: 'de',
          target: 'en',
          format: 'text'
        })
      })
      if (response.ok) {
        const data = await response.json()
        return data.translatedText || sentence
      }
      return null
    },
    async () => {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sentence)}&langpair=de|en`
      )
      if (response.ok) {
        const data = await response.json()
        return data.responseData?.translatedText || sentence
      }
      return null
    }
  ]

  for (const api of apis) {
    try {
      const translation = await api()
      if (translation && translation !== sentence && translation.length > 0) {
        return translation
      }
    } catch (error) {
      console.warn('Translation API failed:', error)
      continue
    }
  }

  return sentence // Fallback to original
}

