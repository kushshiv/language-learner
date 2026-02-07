import type { ReadingContent } from '../types'
import { isCloudSyncEnabled } from './wordStorage'
import { getGitHubToken } from './gistStorage'

// Gist configuration for reading modules
const READING_GIST_FILENAME = 'german-reading-modules.json'
const READING_GIST_DESCRIPTION = 'German Language Learner - Reading Modules'

// Local storage key
const READING_MODULES_KEY = 'german-reading-modules'
const READING_PROGRESS_KEY = 'german-reading-progress'

/**
 * Save reading modules locally
 */
function saveReadingModulesLocal(modules: ReadingContent[]): void {
  try {
    localStorage.setItem(READING_MODULES_KEY, JSON.stringify(modules))
  } catch (error) {
    console.error('Failed to save reading modules locally:', error)
  }
}

/**
 * Load reading modules locally
 */
function loadReadingModulesLocal(): ReadingContent[] {
  try {
    const data = localStorage.getItem(READING_MODULES_KEY)
    if (data) {
      return JSON.parse(data) as ReadingContent[]
    }
  } catch (error) {
    console.error('Failed to load reading modules locally:', error)
  }
  return []
}

/**
 * Save reading modules to GitHub Gist
 */
async function saveReadingModulesToGist(modules: ReadingContent[]): Promise<void> {
  const token = await getGitHubToken()
  if (!token) {
    throw new Error('GitHub token not configured')
  }

  // Try to find existing reading gist
  let readingGistId: string | null = null
  
  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (response.ok) {
      const gists = await response.json()
      
      // Find existing reading gist
      for (const gist of gists) {
        if (gist.description === READING_GIST_DESCRIPTION && gist.files && gist.files[READING_GIST_FILENAME]) {
          readingGistId = gist.id
          break
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch gists, will create new one:', error)
  }

  const gistData = {
    description: READING_GIST_DESCRIPTION,
    public: false,
    files: {
      [READING_GIST_FILENAME]: {
        content: JSON.stringify(modules, null, 2)
      }
    }
  }

  if (readingGistId) {
    // Update existing gist
    const updateResponse = await fetch(`https://api.github.com/gists/${readingGistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gistData)
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update reading modules gist')
    }
  } else {
    // Create new gist
    const createResponse = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gistData)
    })

    if (!createResponse.ok) {
      throw new Error('Failed to create reading modules gist')
    }
  }
}

/**
 * Load reading modules from GitHub Gist
 */
async function loadReadingModulesFromGist(): Promise<ReadingContent[]> {
  const token = await getGitHubToken()
  if (!token) {
    return []
  }

  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return []
    }

    const gists = await response.json()

    // Find reading gist
    for (const gist of gists) {
      if (gist.description === READING_GIST_DESCRIPTION && gist.files && gist.files[READING_GIST_FILENAME]) {
        const file = gist.files[READING_GIST_FILENAME]
        const content = await fetch(file.raw_url).then(r => r.text())
        const modules = JSON.parse(content) as ReadingContent[]
        // Ensure all modules have required fields
        return modules.map(m => ({
          ...m,
          currentLineIndex: m.currentLineIndex || 0,
          updatedAt: m.updatedAt || m.createdAt || new Date().toISOString()
        }))
      }
    }
  } catch (error) {
    console.error('Failed to load reading modules from Gist:', error)
  }

  return []
}

/**
 * Get all reading modules (from cloud if enabled, otherwise local)
 */
export async function getAllReadingModules(): Promise<ReadingContent[]> {
  const cloudEnabled = await isCloudSyncEnabled()
  
  if (cloudEnabled) {
    try {
      const cloudModules = await loadReadingModulesFromGist()
      if (cloudModules && cloudModules.length > 0) {
        // Also save to local as backup
        saveReadingModulesLocal(cloudModules)
        return cloudModules
      }
    } catch (error) {
      console.warn('Failed to load from cloud, using local:', error)
    }
  }

  // Fallback to local
  return loadReadingModulesLocal()
}

/**
 * Save reading modules (to cloud if enabled, always to local)
 */
export async function saveReadingModules(modules: ReadingContent[]): Promise<void> {
  // Always save locally first
  saveReadingModulesLocal(modules)

  // If cloud sync is enabled, also save to cloud
  const cloudEnabled = await isCloudSyncEnabled()
  if (cloudEnabled) {
    try {
      await saveReadingModulesToGist(modules)
      console.log('Reading modules saved to cloud sync')
    } catch (error) {
      console.warn('Failed to save to cloud, modules saved locally:', error)
    }
  }
}

/**
 * Add or update a reading module
 */
export async function saveReadingModule(module: ReadingContent): Promise<void> {
  const allModules = await getAllReadingModules()
  
  // Find if module already exists (by moduleName)
  const existingIndex = allModules.findIndex(m => m.moduleName === module.moduleName)
  
  if (existingIndex >= 0) {
    // Update existing module
    allModules[existingIndex] = module
  } else {
    // Add new module
    allModules.push(module)
  }

  await saveReadingModules(allModules)
}

/**
 * Update reading progress for a module
 */
export async function updateReadingProgress(moduleName: string, currentLineIndex: number): Promise<void> {
  const allModules = await getAllReadingModules()
  const module = allModules.find(m => m.moduleName === moduleName)
  
  if (module) {
    module.currentLineIndex = currentLineIndex
    module.updatedAt = new Date().toISOString()
    await saveReadingModule(module)
  }
}

/**
 * Get a reading module by name
 */
export async function getReadingModule(moduleName: string): Promise<ReadingContent | null> {
  const allModules = await getAllReadingModules()
  return allModules.find(m => m.moduleName === moduleName) || null
}

/**
 * Delete a reading module
 */
export async function deleteReadingModule(moduleName: string): Promise<void> {
  const allModules = await getAllReadingModules()
  const filtered = allModules.filter(m => m.moduleName !== moduleName)
  await saveReadingModules(filtered)
}

