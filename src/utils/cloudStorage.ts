import { createClient } from '@supabase/supabase-js'
import type { Word } from '../types'

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Storage bucket name
const WORDS_BUCKET = 'german-words'

// Initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}

// Fallback to localStorage if Supabase is not configured
const FALLBACK_STORAGE_KEY = 'german-words-cloud'

/**
 * Save words to cloud storage (Supabase) or localStorage fallback
 */
export async function saveWordsToCloud(words: Word[]): Promise<void> {
  const client = getSupabaseClient()
  
  if (!client) {
    // Fallback to localStorage if Supabase not configured
    console.warn('Supabase not configured, using localStorage fallback')
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(words))
    } catch (error) {
      console.error('Failed to save words to localStorage:', error)
    }
    return
  }

  try {
    // Store words as JSON in Supabase Storage
    const wordsJson = JSON.stringify(words)
    const { error } = await client.storage
      .from(WORDS_BUCKET)
      .upload('words.json', wordsJson, {
        contentType: 'application/json',
        upsert: true // Overwrite if exists
      })

    if (error) {
      throw error
    }
    console.log('Words saved to Supabase cloud storage')
  } catch (error) {
    console.error('Failed to save words to cloud storage:', error)
    // Fallback to localStorage
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(words))
      console.warn('Fell back to localStorage')
    } catch (localError) {
      console.error('Failed to save words to localStorage:', localError)
    }
  }
}

/**
 * Load words from cloud storage (Supabase) or localStorage fallback
 */
export async function loadWordsFromCloud(): Promise<Word[]> {
  const client = getSupabaseClient()
  
  if (!client) {
    // Fallback to localStorage if Supabase not configured
    console.warn('Supabase not configured, using localStorage fallback')
    try {
      const data = localStorage.getItem(FALLBACK_STORAGE_KEY)
      if (data) {
        return JSON.parse(data) as Word[]
      }
    } catch (error) {
      console.error('Failed to load words from localStorage:', error)
    }
    return []
  }

  try {
    const { data, error } = await client.storage
      .from(WORDS_BUCKET)
      .download('words.json')

    if (error) {
      // File might not exist yet, that's okay
      if (error.message.includes('not found') || error.statusCode === '404') {
        console.log('No words file found in cloud storage yet')
        return []
      }
      throw error
    }

    if (data) {
      const text = await data.text()
      const words = JSON.parse(text) as Word[]
      console.log(`Loaded ${words.length} words from Supabase cloud storage`)
      return words
    }
  } catch (error) {
    console.error('Failed to load words from cloud storage:', error)
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(FALLBACK_STORAGE_KEY)
      if (data) {
        console.warn('Fell back to localStorage')
        return JSON.parse(data) as Word[]
      }
    } catch (localError) {
      console.error('Failed to load words from localStorage:', localError)
    }
  }

  return []
}

/**
 * Check if a word already exists in cloud storage (by German word in base form)
 */
export async function wordExistsInCloud(germanWord: string): Promise<boolean> {
  const words = await loadWordsFromCloud()
  const normalizedWord = germanWord.toLowerCase().trim()
  return words.some(w => w.german.toLowerCase().trim() === normalizedWord)
}

/**
 * Get all existing words from cloud storage
 */
export async function getAllWordsFromCloud(): Promise<Word[]> {
  return await loadWordsFromCloud()
}

/**
 * Append new words to cloud storage, avoiding duplicates
 */
export async function appendWordsToCloud(newWords: Word[]): Promise<Word[]> {
  const existingWords = await loadWordsFromCloud()
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
  
  // Save back to cloud
  await saveWordsToCloud(allWords)
  
  return allWords
}
