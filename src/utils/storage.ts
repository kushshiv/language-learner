import type { Word } from '../types'

const STORAGE_KEY = 'german-words'

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

export function clearWords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear words:', error)
  }
}

