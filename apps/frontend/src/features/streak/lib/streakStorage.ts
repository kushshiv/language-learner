import type { StreakData, StreakDay } from '../../../shared/types'
import { getGitHubToken, saveWordsToGist, loadWordsFromGist } from '../../words/lib/gistStorage'

// Storage keys
const STREAK_DATA_KEY = 'streak-data'
const STREAK_GIST_FILENAME = 'streak-data.json'
const DEFAULT_DAILY_GOAL = 30

// IndexedDB for better persistence (falls back to localStorage)
const DB_NAME = 'LanguageLearnerDB'
const DB_VERSION = 1
const STORE_NAME = 'settings'
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
        resolve(localStorage.getItem(key))
      }
    })
  } catch {
    return localStorage.getItem(key)
  }
}

/**
 * Set value in IndexedDB or localStorage fallback
 */
async function setStorageValue(key: string, value: string): Promise<void> {
  try {
    const database = await initDB()
    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(value, key)

      request.onsuccess = () => {
        localStorage.setItem(key, value)
        resolve()
      }

      request.onerror = () => {
        localStorage.setItem(key, value)
        resolve()
      }
    })
  } catch {
    localStorage.setItem(key, value)
  }
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Get initial streak data
 */
function getInitialStreakData(): StreakData {
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    streakHistory: {},
    // Use an old timestamp so that any real cloud data
    // will always win on first sync for new devices.
    lastUpdated: new Date(0).toISOString()
  }
}

/**
 * Load streak data from local storage
 */
export async function loadStreakData(): Promise<StreakData> {
  try {
    const dataStr = await getStorageValue(STREAK_DATA_KEY)
    if (!dataStr) {
      return getInitialStreakData()
    }
    const data = JSON.parse(dataStr) as StreakData
    // Ensure dailyGoal exists (for backward compatibility)
    if (!data.dailyGoal) {
      data.dailyGoal = DEFAULT_DAILY_GOAL
    }
    return data
  } catch (error) {
    console.error('Failed to load streak data:', error)
    return getInitialStreakData()
  }
}

/**
 * Save streak data to local storage
 */
async function saveStreakDataLocal(data: StreakData): Promise<void> {
  data.lastUpdated = new Date().toISOString()
  await setStorageValue(STREAK_DATA_KEY, JSON.stringify(data))
}

/**
 * Save streak data to Gist (if cloud sync is enabled)
 */
async function saveStreakDataToGist(data: StreakData): Promise<void> {
  const token = await getGitHubToken()
  if (!token) {
    return // Cloud sync not enabled
  }

  try {
    let gistId = await getStorageValue('streak-gist-id')
    
    // If no gist ID, try to find existing gist
    if (!gistId) {
      const gistsResponse = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      })
      
      if (gistsResponse.ok) {
        const gists = await gistsResponse.json()
        const existingGist = gists.find((gist: any) => 
          gist.description === 'German Language Learner - Streak Data' &&
          gist.files[STREAK_GIST_FILENAME]
        )
        
        if (existingGist) {
          gistId = existingGist.id
          await setStorageValue('streak-gist-id', gistId)
        }
      }
    }
    
    if (gistId) {
      // Update existing gist
      const updateResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'German Language Learner - Streak Data',
          files: {
            [STREAK_GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      })
      
      if (!updateResponse.ok) {
        console.warn('Failed to update streak gist, will try to create new one')
        gistId = null // Reset to create new
      }
    }
    
    if (!gistId) {
      // Create new gist
      const createResponse = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'German Language Learner - Streak Data',
          public: false,
          files: {
            [STREAK_GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      })
      
      if (createResponse.ok) {
        const gistData = await createResponse.json()
        await setStorageValue('streak-gist-id', gistData.id)
      }
    }
  } catch (error) {
    console.error('Failed to save streak data to Gist:', error)
    // Don't throw - local storage is the primary source
  }
}

/**
 * Load streak data from Gist (if cloud sync is enabled)
 */
async function loadStreakDataFromGist(): Promise<StreakData | null> {
  const token = await getGitHubToken()
  if (!token) {
    return null
  }

  try {
    const gistId = await getStorageValue('streak-gist-id')
    if (!gistId) {
      // Try to find existing gist
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      })
      
      if (response.ok) {
        const gists = await response.json()
        const existingGist = gists.find((gist: any) => 
          gist.description === 'German Language Learner - Streak Data' &&
          gist.files[STREAK_GIST_FILENAME]
        )
        
        if (existingGist) {
          await setStorageValue('streak-gist-id', existingGist.id)
          const file = existingGist.files[STREAK_GIST_FILENAME]
          if (file) {
            return JSON.parse(file.content) as StreakData
          }
        }
      }
      return null
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    })

    if (response.ok) {
      const gistData = await response.json()
      const file = gistData.files[STREAK_GIST_FILENAME]
      if (file) {
        return JSON.parse(file.content) as StreakData
      }
    }
  } catch (error) {
    console.error('Failed to load streak data from Gist:', error)
  }

  return null
}

/**
 * Sync streak data from Gist to local (if cloud sync is enabled)
 */
export async function syncStreakDataFromCloud(): Promise<void> {
  const cloudData = await loadStreakDataFromGist()
  if (cloudData) {
    const localData = await loadStreakData()
    // Merge: use cloud data if it's newer, otherwise keep local
    if (new Date(cloudData.lastUpdated) > new Date(localData.lastUpdated)) {
      await saveStreakDataLocal(cloudData)
    } else if (new Date(localData.lastUpdated) > new Date(cloudData.lastUpdated)) {
      // Local is newer, sync to cloud
      await saveStreakDataToGist(localData)
    }
  }
}

/**
 * Save streak data (local + cloud if enabled)
 */
export async function saveStreakData(data: StreakData): Promise<void> {
  await saveStreakDataLocal(data)
  await saveStreakDataToGist(data)
}

/**
 * Track a word as practiced today
 */
export async function trackWordPracticed(germanWord: string): Promise<{ completed: boolean; currentCount: number; goal: number; isNew: boolean }> {
  const data = await loadStreakData()
  const today = getTodayString()
  
  // Check if this word was already practiced today
  const wordKey = `words_${today}`
  const practicedWordsStr = await getStorageValue(wordKey)
  const practicedWords = practicedWordsStr ? new Set<string>(JSON.parse(practicedWordsStr)) : new Set<string>()
  
  const normalizedWord = germanWord.toLowerCase().trim()
  const isNew = !practicedWords.has(normalizedWord)
  
  if (isNew) {
    // New unique word for today
    practicedWords.add(normalizedWord)
    data.streakHistory[today] = practicedWords.size
    await setStorageValue(wordKey, JSON.stringify(Array.from(practicedWords)))
    await saveStreakData(data)
  }
  
  const currentCount = data.streakHistory[today] || practicedWords.size
  const completed = currentCount >= data.dailyGoal
  
  return {
    completed,
    currentCount,
    goal: data.dailyGoal,
    isNew
  }
}

/**
 * Get today's progress
 */
export async function getTodayProgress(): Promise<{ currentCount: number; goal: number; completed: boolean }> {
  const data = await loadStreakData()
  const today = getTodayString()
  const currentCount = data.streakHistory[today] || 0
  const completed = currentCount >= data.dailyGoal
  
  return {
    currentCount,
    goal: data.dailyGoal,
    completed
  }
}

/**
 * Get streak history as array of days
 */
export async function getStreakHistory(): Promise<StreakDay[]> {
  const data = await loadStreakData()
  const days: StreakDay[] = []
  
  // Get all dates from history
  const dates = Object.keys(data.streakHistory).sort()
  
  for (const date of dates) {
    const count = data.streakHistory[date]
    days.push({
      date,
      count,
      completed: count >= data.dailyGoal
    })
  }
  
  return days
}

/**
 * Get current streak count (consecutive days with completed goal)
 */
export async function getCurrentStreak(): Promise<number> {
  const days = await getStreakHistory()
  if (days.length === 0) return 0
  
  // Sort by date descending
  days.sort((a, b) => b.date.localeCompare(a.date))
  
  let streak = 0
  const today = getTodayString()
  
  // Check if today is completed
  const todayData = days.find(d => d.date === today)
  if (todayData && todayData.completed) {
    streak = 1
  } else {
    // Check yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdayData = days.find(d => d.date === yesterdayStr)
    if (yesterdayData && yesterdayData.completed) {
      streak = 0 // Today not completed, but yesterday was
    } else {
      return 0 // Neither today nor yesterday completed
    }
  }
  
  // Count backwards from today/yesterday
  let checkDate = new Date(todayData ? today : yesterdayStr)
  
  for (let i = 0; i < 365; i++) { // Max 1 year streak
    const dateStr = checkDate.toISOString().split('T')[0]
    const dayData = days.find(d => d.date === dateStr)
    
    if (dayData && dayData.completed) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Get achievements based on streak
 */
export async function getAchievements(): Promise<{ milestone: string; achieved: boolean; days: number }[]> {
  const streak = await getCurrentStreak()
  
  const milestones = [
    { name: '1 Week', days: 7 },
    { name: '15 Days', days: 15 },
    { name: '30 Days', days: 30 },
    { name: '45 Days', days: 45 },
    { name: '3 Months', days: 90 }
  ]
  
  return milestones.map(milestone => ({
    milestone: milestone.name,
    achieved: streak >= milestone.days,
    days: milestone.days
  }))
}

/**
 * Update daily goal
 */
export async function updateDailyGoal(newGoal: number): Promise<void> {
  const data = await loadStreakData()
  data.dailyGoal = Math.max(1, Math.min(1000, newGoal)) // Clamp between 1 and 1000
  await saveStreakData(data)
}

/**
 * Get daily goal
 */
export async function getDailyGoal(): Promise<number> {
  const data = await loadStreakData()
  return data.dailyGoal
}

