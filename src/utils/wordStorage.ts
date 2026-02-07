import type { Word } from '../types'
import { saveWords as saveWordsLocal, loadWords as loadWordsLocal } from './storage'
import { 
  saveWordsToGist, 
  loadWordsFromGist, 
  appendWordsToGist, 
  getAllWordsFromGist,
  wordExistsInGist,
  isGitHubConfigured 
} from './gistStorage'

/**
 * Unified word storage - uses localStorage by default, optionally syncs with GitHub Gists
 */

/**
 * Check if cloud sync (GitHub Gists) is enabled
 */
export async function isCloudSyncEnabled(): Promise<boolean> {
  return await isGitHubConfigured()
}

/**
 * Get all words - from cloud if enabled, otherwise from localStorage
 */
export async function getAllWords(): Promise<Word[]> {
  const cloudEnabled = await isCloudSyncEnabled()
  
  if (cloudEnabled) {
    try {
      const cloudWords = await getAllWordsFromGist()
      if (cloudWords.length > 0) {
        // Also save to localStorage as backup
        saveWordsLocal(cloudWords)
        return cloudWords
      }
    } catch (error) {
      console.warn('Failed to load from cloud, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  const localWords = loadWordsLocal()
  return localWords || []
}

/**
 * Save words - to cloud if enabled, always to localStorage
 */
export async function saveWords(words: Word[]): Promise<void> {
  // Always save to localStorage first (fast, always available)
  saveWordsLocal(words)
  
  // If cloud sync is enabled, also save to cloud
  const cloudEnabled = await isCloudSyncEnabled()
  if (cloudEnabled) {
    try {
      await saveWordsToGist(words)
      console.log('Words saved to cloud sync')
    } catch (error) {
      console.warn('Failed to save to cloud, words saved locally:', error)
      // Don't throw - localStorage save succeeded
    }
  }
}

/**
 * Append new words, avoiding duplicates
 */
export async function appendWords(newWords: Word[]): Promise<Word[]> {
  const existingWords = await getAllWords()
  const existingWordsMap = new Map<string, Word>()
  
  // Create a map of existing words by their normalized German form
  existingWords.forEach(word => {
    const key = word.german.toLowerCase().trim()
    existingWordsMap.set(key, word)
  })

  // Add only new words (not already in storage)
  const wordsToAdd: Word[] = []
  newWords.forEach(word => {
    const key = word.german.toLowerCase().trim()
    if (!existingWordsMap.has(key)) {
      wordsToAdd.push(word)
      existingWordsMap.set(key, word)
    }
  })

  // Combine existing and new words
  const allWords = [...existingWords, ...wordsToAdd]
  
  // Save all words
  await saveWords(allWords)
  
  return allWords
}

/**
 * Check if a word exists
 */
export async function wordExists(germanWord: string): Promise<boolean> {
  const cloudEnabled = await isCloudSyncEnabled()
  
  if (cloudEnabled) {
    try {
      return await wordExistsInGist(germanWord)
    } catch (error) {
      console.warn('Failed to check cloud, checking local:', error)
    }
  }
  
  // Check localStorage
  const words = loadWordsLocal()
  if (!words) return false
  
  const normalizedWord = germanWord.toLowerCase().trim()
  return words.some(w => w.german.toLowerCase().trim() === normalizedWord)
}

/**
 * Sync local words to cloud (one-time sync when enabling cloud)
 */
export async function syncLocalToCloud(): Promise<void> {
  const localWords = loadWordsLocal()
  if (localWords && localWords.length > 0) {
    try {
      await saveWordsToGist(localWords)
      console.log(`Synced ${localWords.length} words to cloud`)
    } catch (error) {
      console.error('Failed to sync to cloud:', error)
      throw error
    }
  }
}

