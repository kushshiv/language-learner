import type { Word } from '../types'
import { lemmatizeWord, extractArticle } from './lemmatizer'
import { getAllWords, wordExists } from './wordStorage'

// Common German verb endings
const VERB_ENDINGS = ['en', 'st', 't', 'n', 'e', 'te', 'ten', 'test', 'tet', 'est', 'et']
// Common German noun patterns (capitalized words)
// German adjectives often end with these
const ADJECTIVE_ENDINGS = ['ig', 'lich', 'isch', 'bar', 'sam', 'los', 'voll', 'haft']

interface WordCandidate {
  word: string
  lemmatized: string
  type: 'verb' | 'noun' | 'adjective'
  context: string
  sentence: string
  article?: 'der' | 'die' | 'das'
}

export async function extractWords(text: string): Promise<Word[]> {
  // Load existing words to check for duplicates
  const existingWords = await getAllWords()
  const existingWordsMap = new Map<string, Word>()
  existingWords.forEach(word => {
    const key = word.german.toLowerCase().trim()
    existingWordsMap.set(key, word)
  })

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
        // Lemmatize the word to get its base form
        const lemmatized = lemmatizeWord(cleanToken, type)
        const key = lemmatized.toLowerCase().trim()

        // Only add if we haven't seen this lemmatized form yet
        if (!wordMap.has(key)) {
          // Extract article for nouns
          let article: 'der' | 'die' | 'das' | undefined = undefined
          if (type === 'noun') {
            article = extractArticle(cleanToken, sentence, type)
          }

          const candidate: WordCandidate = {
            word: cleanToken,
            lemmatized,
            type,
            context: sentence,
            sentence: getShortSentence(sentence, token),
            article
          }
          wordMap.set(key, candidate)
          words.push(candidate)
        }
      }
    })
  })

  // Filter out words that already exist in Gist
  const newWords = words.filter(candidate => {
    const key = candidate.lemmatized.toLowerCase().trim()
    return !existingWordsMap.has(key)
  })

  console.log(`Found ${words.length} unique words, ${newWords.length} are new`)

  // Translate only new words
  const translatedWords = await translateWords(newWords, existingWords)

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

async function translateWords(
  candidates: WordCandidate[],
  existingWords: Word[] = []
): Promise<Word[]> {
  const words: Word[] = []

  // Create a map of existing words for quick lookup
  const existingMap = new Map<string, Word>()
  existingWords.forEach(word => {
    existingMap.set(word.german.toLowerCase().trim(), word)
  })

  // Translate words (limit to 100 to avoid rate limits)
  for (const candidate of candidates.slice(0, 100)) {
    const key = candidate.lemmatized.toLowerCase().trim()
    
    // Double-check it doesn't exist (in case of race conditions)
    if (existingMap.has(key)) {
      continue
    }

    // Check storage one more time before translating
    const exists = await wordExists(candidate.lemmatized)
    if (exists) {
      continue
    }

    const translation = await translateWord(candidate.lemmatized)
    if (translation) {
      const word: Word = {
        german: candidate.lemmatized,
        english: translation,
        type: candidate.type,
        example: candidate.sentence,
        context: candidate.context,
        article: candidate.article
      }
      words.push(word)
      
      // Add to existing map to avoid duplicates in this batch
      existingMap.set(key, word)
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
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
