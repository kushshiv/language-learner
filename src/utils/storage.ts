import type { Word, Sentence } from '../types'

const STORAGE_KEY = 'german-words'
const SENTENCES_KEY = 'german-sentences'
const PDF_TEXT_KEY = 'pdf-text'

export function saveWords(words: Word[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  } catch (error) {
    console.error('Failed to save words:', error)
  }
}

export function loadWords(): Word[] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data) as Word[]
    }
  } catch (error) {
    console.error('Failed to load words:', error)
  }
  return null
}

export function saveSentences(sentences: Sentence[]): void {
  try {
    localStorage.setItem(SENTENCES_KEY, JSON.stringify(sentences))
  } catch (error) {
    console.error('Failed to save sentences:', error)
  }
}

export function loadSentences(): Sentence[] | null {
  try {
    const data = localStorage.getItem(SENTENCES_KEY)
    if (data) {
      return JSON.parse(data) as Sentence[]
    }
  } catch (error) {
    console.error('Failed to load sentences:', error)
  }
  return null
}

export function savePdfText(text: string): void {
  try {
    localStorage.setItem(PDF_TEXT_KEY, text)
  } catch (error) {
    console.error('Failed to save PDF text:', error)
  }
}

export function loadPdfText(): string | null {
  try {
    return localStorage.getItem(PDF_TEXT_KEY)
  } catch (error) {
    console.error('Failed to load PDF text:', error)
  }
  return null
}

export function clearWords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SENTENCES_KEY)
    localStorage.removeItem(PDF_TEXT_KEY)
  } catch (error) {
    console.error('Failed to clear words:', error)
  }
}
