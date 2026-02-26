import { getAllWords } from './wordStorage'
import type { Word } from '../types'

const REPEATED_PRACTICE_STORAGE_KEY = 'repeated-practice-words'
const REPEATED_PRACTICE_LIST_KEY = 'repeated-practice-list'
const REPEATED_PRACTICE_SIZE = 20

/**
 * Get all words sorted deterministically by German word (alphabetically)
 * This ensures consistent seeding across sessions
 */
export const getWordsSortedByName = async (): Promise<Word[]> => {
  const words = await getAllWords()
  return words.sort((a, b) => a.german.toLowerCase().localeCompare(b.german.toLowerCase()))
}

/**
 * Get the initial 20 words for repeated practice (first 20 alphabetically)
 */
export const getInitialRepeatedPracticeWords = async (): Promise<Word[]> => {
  const sortedWords = await getWordsSortedByName()
  return sortedWords.slice(0, REPEATED_PRACTICE_SIZE)
}

/**
 * Get a specific chunk of 20 words for repeated practice by chunk number
 * Chunk 1 = words 1-20, Chunk 2 = words 21-40, etc.
 */
export const getRepeatedPracticeChunk = async (chunkNumber: number): Promise<Word[]> => {
  const sortedWords = await getWordsSortedByName()
  const startIndex = (chunkNumber - 1) * REPEATED_PRACTICE_SIZE
  const endIndex = Math.min(startIndex + REPEATED_PRACTICE_SIZE, sortedWords.length)

  if (startIndex >= sortedWords.length) {
    return []
  }

  return sortedWords.slice(startIndex, endIndex)
}

/**
 * Get the current repeated practice list, initializing if needed
 * @deprecated Use getRepeatedPracticeChunk instead for chunk-based selection
 */
export const getRepeatedPracticeList = async (): Promise<Word[]> => {
  const stored = localStorage.getItem(REPEATED_PRACTICE_LIST_KEY)

  if (stored) {
    try {
      const germanWords: string[] = JSON.parse(stored)
      const allWords = await getAllWords()

      // Filter words to only include those in the stored list
      const practiceWords = allWords.filter(word =>
        germanWords.includes(word.german.toLowerCase().trim())
      )

      // If we have less than 20 words, fill with next words from the sorted list
      if (practiceWords.length < REPEATED_PRACTICE_SIZE) {
        const sortedWords = await getWordsSortedByName()
        const practiced = new Set(practiceWords.map(w => w.german.toLowerCase().trim()))

        for (const word of sortedWords) {
          if (!practiced.has(word.german.toLowerCase().trim()) && practiceWords.length < REPEATED_PRACTICE_SIZE) {
            practiceWords.push(word)
          }
        }
      }

      return practiceWords.sort((a, b) => a.german.toLowerCase().localeCompare(b.german.toLowerCase()))
    } catch (error) {
      console.error('Failed to load repeated practice list:', error)
    }
  }

  // Initialize with first 20 words
  const initialWords = await getInitialRepeatedPracticeWords()
  saveRepeatedPracticeList(initialWords)
  return initialWords
}

/**
 * Save the repeated practice list (stores only the German words for references)
 */
export const saveRepeatedPracticeList = (words: Word[]): void => {
  const germanWords = words.map(w => w.german.toLowerCase().trim())
  localStorage.setItem(REPEATED_PRACTICE_LIST_KEY, JSON.stringify(germanWords))
}

/**
 * Remove a word from repeated practice and replace it with the next available word
 */
export const replaceWordInRepeatedPractice = async (germanWordToRemove: string): Promise<Word | null> => {
  const currentList = await getRepeatedPracticeList()
  const normalizedRemove = germanWordToRemove.toLowerCase().trim()

  // Remove the word
  const updatedList = currentList.filter(w => w.german.toLowerCase().trim() !== normalizedRemove)

  if (updatedList.length < REPEATED_PRACTICE_SIZE) {
    // Find the next word to add
    const sortedWords = await getWordsSortedByName()
    const practiced = new Set(updatedList.map(w => w.german.toLowerCase().trim()))

    for (const word of sortedWords) {
      if (!practiced.has(word.german.toLowerCase().trim())) {
        updatedList.push(word)
        saveRepeatedPracticeList(updatedList)
        return word
      }
    }
  } else {
    saveRepeatedPracticeList(updatedList)
  }

  return null
}

/**
 * Reset repeated practice to the first 20 words
 */
export const resetRepeatedPractice = async (): Promise<void> => {
  const initialWords = await getInitialRepeatedPracticeWords()
  saveRepeatedPracticeList(initialWords)
}

/**
 * Get statistics about the repeated practice set
 */
export const getRepeatedPracticeStats = async (): Promise<{
  currentSize: number
  targetSize: number
  completionPercent: number
}> => {
  const list = await getRepeatedPracticeList()
  return {
    currentSize: list.length,
    targetSize: REPEATED_PRACTICE_SIZE,
    completionPercent: (list.length / REPEATED_PRACTICE_SIZE) * 100
  }
}


