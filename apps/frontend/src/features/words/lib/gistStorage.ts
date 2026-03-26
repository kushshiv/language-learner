import type { Word } from '../../../shared/types'
import { apiPost } from '../../../shared/api/httpClient'

// GitHub Gist configuration
const GIST_FILENAME = 'german-words.json'
const GIST_DESCRIPTION = 'German Language Learner - Word Database'

// Storage keys
const GITHUB_TOKEN_KEY = 'github-gist-token'
const GIST_ID_KEY = 'github-gist-id'
const DB_NAME = 'LanguageLearnerDB'
const DB_VERSION = 1
const STORE_NAME = 'settings'

// IndexedDB for better persistence (falls back to localStorage)
let db: IDBDatabase | null = null

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.warn('IndexedDB not available, using localStorage')
      reject(new Error('IndexedDB not available'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Get value from IndexedDB or localStorage fallback
 */
async function getStorageValue(key: string): Promise<string | null> {
  try {
    const database = await initDB()
    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        // Fallback to localStorage
        resolve(localStorage.getItem(key))
      }
    })
  } catch {
    // Fallback to localStorage
    return localStorage.getItem(key)
  }
}

/**
 * Set value in IndexedDB or localStorage fallback
 */
async function setStorageValue(key: string, value: string): Promise<void> {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(value, key)

      request.onsuccess = () => {
        // Also save to localStorage as backup
        localStorage.setItem(key, value)
        resolve()
      }

      request.onerror = () => {
        // Fallback to localStorage
        localStorage.setItem(key, value)
        resolve()
      }
    })
  } catch {
    // Fallback to localStorage
    localStorage.setItem(key, value)
  }
}

/**
 * Remove value from IndexedDB and localStorage
 */
async function removeStorageValue(key: string): Promise<void> {
  try {
    const database = await initDB()
    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => {
        localStorage.removeItem(key)
        resolve()
      }

      request.onerror = () => {
        localStorage.removeItem(key)
        resolve()
      }
    })
  } catch {
    localStorage.removeItem(key)
  }
}

/**
 * Get GitHub token from IndexedDB or localStorage
 */
export async function getGitHubToken(): Promise<string | null> {
  return await getStorageValue(GITHUB_TOKEN_KEY)
}

/**
 * Save GitHub token to IndexedDB or localStorage
 */
export async function saveGitHubToken(token: string): Promise<void> {
  await setStorageValue(GITHUB_TOKEN_KEY, token)
}

/**
 * Remove GitHub token (for logout/clear)
 */
export async function clearGitHubToken(): Promise<void> {
  await removeStorageValue(GITHUB_TOKEN_KEY)
  await removeStorageValue(GIST_ID_KEY)
}

/**
 * Check if GitHub token is configured
 */
export async function isGitHubConfigured(): Promise<boolean> {
  const token = await getGitHubToken()
  return !!token
}

/**
 * Get stored Gist ID
 */
async function getGistId(): Promise<string | null> {
  return await getStorageValue(GIST_ID_KEY)
}

/**
 * Save Gist ID for future updates
 */
async function saveGistId(gistId: string): Promise<void> {
  await setStorageValue(GIST_ID_KEY, gistId)
}

/**
 * Create a new Gist with words
 */
async function createGist(words: Word[], token: string): Promise<string> {
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false, // Private gist
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(words, null, 2)
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create gist' }))
    throw new Error(error.message || `HTTP ${response.status}: Failed to create gist`)
  }

  const data = await response.json()
  await saveGistId(data.id)
  return data.id
}

/**
 * Update existing Gist with new words
 */
async function updateGist(gistId: string, words: Word[], token: string): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(words, null, 2)
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update gist' }))
    throw new Error(error.message || `HTTP ${response.status}: Failed to update gist`)
  }
}

/**
 * Get existing Gist
 */
async function getGist(gistId: string, token: string): Promise<Word[]> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      return [] // Gist doesn't exist yet
    }
    const error = await response.json().catch(() => ({ message: 'Failed to get gist' }))
    throw new Error(error.message || `HTTP ${response.status}: Failed to get gist`)
  }

  const data = await response.json()
  const file = data.files[GIST_FILENAME]
  
  if (!file) {
    return []
  }

  try {
    const words = JSON.parse(file.content) as Word[]
    return words
  } catch (error) {
    console.error('Failed to parse gist content:', error)
    return []
  }
}

/**
 * Find existing Gist by searching user's gists
 */
async function findExistingGist(token: string): Promise<string | null> {
  const response = await fetch('https://api.github.com/gists', {
    method: 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  })

  if (!response.ok) {
    return null
  }

  const gists = await response.json()
  // Find gist with matching description
  const existingGist = gists.find((gist: any) => 
    gist.description === GIST_DESCRIPTION && 
    gist.files[GIST_FILENAME]
  )

  if (existingGist) {
    await saveGistId(existingGist.id)
    return existingGist.id
  }

  return null
}

/**
 * Save words to GitHub Gist
 */
export async function saveWordsToGist(words: Word[]): Promise<void> {
  const token = await getGitHubToken()
  if (!token) {
    throw new Error('GitHub token not configured. Please set up your GitHub token first.')
  }

  try {
    await apiPost<{ words: Word[] }>('/api/v1/sync/gist/save', { token, words })
    console.log('Words saved to GitHub Gist (via backend)')
  } catch (error) {
    console.error('Failed to save words to GitHub Gist:', error)
    throw error
  }
}

/**
 * Load words from GitHub Gist
 */
export async function loadWordsFromGist(): Promise<Word[]> {
  const token = await getGitHubToken()
  if (!token) {
    console.warn('GitHub token not configured')
    return []
  }

  try {
    const response = await apiPost<{ words: Word[] }>('/api/v1/sync/gist/load', { token })
    const words = response.words || []
    console.log(`Loaded ${words.length} words from GitHub Gist`)
    return words
  } catch (error) {
    console.error('Failed to load words from GitHub Gist:', error)
    return []
  }
}

/**
 * Check if a word already exists in Gist (by German word in base form)
 */
export async function wordExistsInGist(germanWord: string): Promise<boolean> {
  const words = await loadWordsFromGist()
  const normalizedWord = germanWord.toLowerCase().trim()
  return words.some(w => w.german.toLowerCase().trim() === normalizedWord)
}

/**
 * Get all existing words from Gist
 */
export async function getAllWordsFromGist(): Promise<Word[]> {
  return await loadWordsFromGist()
}

/**
 * Append new words to Gist, avoiding duplicates
 */
export async function appendWordsToGist(newWords: Word[]): Promise<Word[]> {
  const existingWords = await loadWordsFromGist()
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
  
  // Save back to Gist
  await saveWordsToGist(allWords)
  
  return allWords
}

/**
 * Delete words from Gist by their German word
 */
export async function deleteWordsFromGist(germanWords: string[]): Promise<Word[]> {
  const token = await getGitHubToken()
  if (!token) {
    throw new Error('GitHub token not configured')
  }

  const response = await apiPost<{ words: Word[] }>('/api/v1/sync/gist/delete', {
    token,
    german_words: germanWords
  })
  return response.words || []
}

/**
 * Export words from Gist to a downloadable JSON file
 */
export async function exportGistToJSON(): Promise<void> {
  const token = await getGitHubToken()
  if (!token) {
    throw new Error('GitHub token not configured. Please set up your GitHub token first.')
  }

  try {
    // Load words from gist
    const words = await loadWordsFromGist()
    
    if (words.length === 0) {
      throw new Error('No words found in Gist to export.')
    }

    // Convert to JSON string with pretty formatting
    const jsonContent = JSON.stringify(words, null, 2)
    
    // Create a Blob with the JSON content
    const blob = new Blob([jsonContent], { type: 'application/json' })
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob)
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = `german-words-export-${new Date().toISOString().split('T')[0]}.json`
    
    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL
    URL.revokeObjectURL(url)
    
    console.log(`Exported ${words.length} words to JSON file`)
  } catch (error) {
    console.error('Failed to export Gist to JSON:', error)
    throw error
  }
}

