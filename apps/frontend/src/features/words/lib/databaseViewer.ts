import { getGitHubToken } from './gistStorage'
import { loadWords as loadWordsLocal } from '../../../shared/lib/storage/localStorage'
import { loadSentences, loadPdfText } from '../../../shared/lib/storage/localStorage'
import { getAllWords } from './wordStorage'

export interface IndexedDBStore {
  name: string
  keyCount: number
  keys: any[]
  sampleData: Record<string, any>
  fullData: Record<string, any> | null
}

export interface IndexedDBDatabase {
  name: string
  version: number
  stores: IndexedDBStore[]
}

export interface LocalStorageItem {
  key: string
  value: any
  size: number
  preview: string
}

export interface GitHubGist {
  id: string
  url: string
  description: string
  createdAt: string
  updatedAt: string
  files: Record<string, {
    filename: string
    size: number
    content: string
    preview: string
  }>
  fullContent: Record<string, string> | null
}

export interface DatabaseInfo {
  localStorage: {
    allItems: LocalStorageItem[]
    totalSize: number
    itemCount: number
  }
  indexedDB: {
    databases: IndexedDBDatabase[]
    totalDatabases: number
  }
  githubGist: {
    enabled: boolean
    allGists: GitHubGist[]
    totalGists: number
  }
}

/**
 * Get all localStorage items with their values
 */
function getAllLocalStorageItems(includeFullData: boolean = false): LocalStorageItem[] {
  const items: LocalStorageItem[] = []
  let totalSize = 0
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const valueStr = localStorage.getItem(key)
        if (valueStr !== null) {
          const size = new Blob([valueStr]).size
          totalSize += size
          
          let parsedValue: any = valueStr
          let preview = valueStr
          
          // Try to parse as JSON
          try {
            parsedValue = JSON.parse(valueStr)
            preview = JSON.stringify(parsedValue, null, 2)
            if (preview.length > 200) {
              preview = preview.substring(0, 200) + '...'
            }
          } catch {
            // Not JSON, use as string
            if (valueStr.length > 200) {
              preview = valueStr.substring(0, 200) + '...'
            }
          }
          
          items.push({
            key,
            value: includeFullData ? parsedValue : (typeof parsedValue === 'object' ? '...' : parsedValue),
            size,
            preview
          })
        }
      } catch (e) {
        // Skip items that can't be read
        console.warn(`Could not read localStorage key: ${key}`, e)
      }
    }
  }
  
  return items
}

/**
 * Get value from IndexedDB
 */
async function getIndexedDBValue(key: string): Promise<string | null> {
  try {
    const DB_NAME = 'LanguageLearnerDB'
    const STORE_NAME = 'settings'
    
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1)
      
      request.onupgradeneeded = () => {
        // Database needs upgrade, but we'll still try to read
      }
      
      request.onsuccess = () => {
        try {
          const db = request.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            resolve(null)
            return
          }
          const transaction = db.transaction([STORE_NAME], 'readonly')
          const store = transaction.objectStore(STORE_NAME)
          const getRequest = store.get(key)
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result || null)
          }
          
          getRequest.onerror = () => {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      }
      
      request.onerror = () => {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

/**
 * Get all data from an IndexedDB object store
 */
async function getStoreData(store: IDBObjectStore, includeFullData: boolean = false): Promise<{
  keyCount: number
  keys: any[]
  sampleData: Record<string, any>
  fullData: Record<string, any> | null
}> {
  const keys: any[] = []
  const sampleData: Record<string, any> = {}
  const fullData: includeFullData extends true ? Record<string, any> : null = includeFullData ? {} as any : null
  
  return new Promise((resolve) => {
    const cursorRequest = store.openCursor()
    let count = 0
    const maxSample = 10
    
    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const key = cursor.key
        const value = cursor.value
        
        keys.push(key)
        
        if (count < maxSample) {
          try {
            // Try to stringify for preview
            const preview = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
            sampleData[String(key)] = preview.length > 200 ? preview.substring(0, 200) + '...' : preview
          } catch {
            sampleData[String(key)] = String(value)
          }
        }
        
        if (includeFullData && fullData) {
          fullData[String(key)] = value
        }
        
        count++
        cursor.continue()
      } else {
        resolve({
          keyCount: count,
          keys,
          sampleData,
          fullData: includeFullData ? fullData : null
        })
      }
    }
    
    cursorRequest.onerror = () => {
      resolve({
        keyCount: count,
        keys,
        sampleData,
        fullData: includeFullData ? fullData : null
      })
    }
  })
}

/**
 * Get all IndexedDB databases and their stores
 * 
 * Note: The IndexedDB API doesn't provide a way to enumerate all databases from JavaScript
 * for security reasons. If you add new databases, add their names to the knownDatabases array below.
 * However, once a database is opened, we can dynamically discover all its object stores and keys.
 */
async function getAllIndexedDBDatabases(includeFullData: boolean = false): Promise<IndexedDBDatabase[]> {
  const databases: IndexedDBDatabase[] = []
  
  // Add any new database names here to make them visible in the viewer
  // The viewer will automatically discover all stores and keys within each database
  const knownDatabases = ['LanguageLearnerDB']
  
  for (const dbName of knownDatabases) {
    try {
      const dbInfo = await getIndexedDBDatabaseInfo(dbName, includeFullData)
      if (dbInfo) {
        databases.push(dbInfo)
      }
    } catch (e) {
      console.warn(`Could not access database: ${dbName}`, e)
    }
  }
  
  return databases
}

/**
 * Get information about a specific IndexedDB database
 */
async function getIndexedDBDatabaseInfo(dbName: string, includeFullData: boolean = false): Promise<IndexedDBDatabase | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName)
    
    request.onerror = () => {
      resolve(null)
    }
    
    request.onsuccess = async () => {
      try {
        const db = request.result
        const version = db.version
        const storeNames = Array.from(db.objectStoreNames)
        const stores: IndexedDBStore[] = []
        
        for (const storeName of storeNames) {
          try {
            const transaction = db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)
            const storeData = await getStoreData(store, includeFullData)
            
            stores.push({
              name: storeName,
              ...storeData
            })
          } catch (e) {
            console.warn(`Could not read store: ${storeName}`, e)
            stores.push({
              name: storeName,
              keyCount: 0,
              keys: [],
              sampleData: {},
              fullData: null
            })
          }
        }
        
        db.close()
        
        resolve({
          name: dbName,
          version,
          stores
        })
      } catch (e) {
        resolve(null)
      }
    }
    
    request.onupgradeneeded = () => {
      // Database needs upgrade, but we'll still try to read
    }
  })
}

/**
 * Mask a token for display (show first 4 and last 4 characters)
 */
function maskToken(token: string): string {
  if (token.length <= 8) {
    return '****'
  }
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
}

/**
 * Fetch all Gists from GitHub API
 */
async function getAllGitHubGists(token: string, includeFullData: boolean = false): Promise<GitHubGist[]> {
  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    })
    
    if (!response.ok) {
      return []
    }
    
    const gists = await response.json()
    const formattedGists: GitHubGist[] = []
    
    for (const gist of gists) {
      const files: Record<string, { filename: string; size: number; content: string; preview: string }> = {}
      const fullContent: Record<string, string> | null = includeFullData ? {} : null
      
      // Fetch full content for each file if needed
      for (const [filename, fileInfo] of Object.entries(gist.files || {})) {
        const file = fileInfo as any
        let content = ''
        let preview = ''
        
        if (file.truncated) {
          // File is truncated, need to fetch full content
          try {
            const fileResponse = await fetch(file.raw_url)
            if (fileResponse.ok) {
              content = await fileResponse.text()
            }
          } catch {
            content = file.content || ''
          }
        } else {
          content = file.content || ''
        }
        
        preview = content.length > 200 ? content.substring(0, 200) + '...' : content
        
        files[filename] = {
          filename,
          size: file.size || content.length,
          content: includeFullData ? content : '',
          preview
        }
        
        if (includeFullData && fullContent) {
          fullContent[filename] = content
        }
      }
      
      formattedGists.push({
        id: gist.id,
        url: gist.html_url,
        description: gist.description || '',
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        files,
        fullContent: includeFullData ? fullContent : null
      })
    }
    
    return formattedGists
  } catch {
    return []
  }
}

/**
 * Get comprehensive database information - dynamically discovers all storage
 */
export async function getDatabaseInfo(includeFullData: boolean = false): Promise<DatabaseInfo> {
  // Get all localStorage items dynamically
  const localStorageItems = getAllLocalStorageItems(includeFullData)
  const totalSize = localStorageItems.reduce((sum, item) => sum + item.size, 0)
  
  // Get all IndexedDB databases dynamically
  const indexedDBDatabases = await getAllIndexedDBDatabases(includeFullData)
  
  // Get GitHub token to check if cloud sync is enabled
  const githubToken = await getIndexedDBValue('github-gist-token')
  const cloudEnabled = !!githubToken
  
  // Get all GitHub Gists if cloud sync is enabled
  let allGists: GitHubGist[] = []
  if (cloudEnabled && githubToken) {
    try {
      allGists = await getAllGitHubGists(githubToken, includeFullData)
    } catch (e) {
      console.warn('Failed to fetch GitHub Gists:', e)
    }
  }
  
  return {
    localStorage: {
      allItems: localStorageItems,
      totalSize,
      itemCount: localStorageItems.length
    },
    indexedDB: {
      databases: indexedDBDatabases,
      totalDatabases: indexedDBDatabases.length
    },
    githubGist: {
      enabled: cloudEnabled,
      allGists,
      totalGists: allGists.length
    }
  }
}

