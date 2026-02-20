<template>
  <div class="settings-container">
    <div class="settings-card">
      <div class="header-row">
        <h1 class="title">⚙️ Settings</h1>
        <button @click="$emit('back')" class="back-btn">← Back</button>
      </div>

      <div class="section">
        <h2 class="section-title">📝 Manage Words</h2>
        <p class="section-desc">
          View, search, and delete words from your database.
        </p>
        <button @click="$emit('manage-words')" class="btn-primary">
          Manage Words
        </button>
      </div>

      <div class="section">
        <h2 class="section-title">🔥 Daily Streak</h2>
        <p class="section-desc">
          Track your daily practice streak and view your progress.
        </p>
        <StreakCalendar />
      </div>

      <div class="section">
        <h2 class="section-title">⚙️ Streak Settings</h2>
        <p class="section-desc">
          Configure your daily word goal and notification preferences.
        </p>
        
        <div class="setting-item">
          <label for="daily-goal" class="setting-label">Daily Word Goal:</label>
          <div class="input-with-button">
            <input
              id="daily-goal"
              v-model.number="dailyGoal"
              type="number"
              min="1"
              max="1000"
              class="number-input"
              @change="updateDailyGoal"
            />
            <button @click="updateDailyGoal" class="btn-small" :disabled="savingGoal">
              {{ savingGoal ? 'Saving...' : 'Save' }}
            </button>
          </div>
          <p class="setting-hint">Number of unique words to practice each day to maintain your streak.</p>
        </div>

        <div class="setting-item">
          <div class="toggle-setting">
            <div class="toggle-info">
              <label class="toggle-label">Enable Daily Reminders</label>
              <p class="toggle-desc">Get notified at 9 AM, 3 PM, and 9 PM to complete your daily streak.</p>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="notificationsEnabled"
                @change="toggleNotifications"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">☁️ Cloud Sync (Optional)</h2>
        <p class="section-desc">
          Enable cloud sync to access your words from any device. Your words are stored in a private GitHub Gist.
        </p>

        <div v-if="!cloudEnabled" class="setup-section">
          <div class="info-box">
            <p><strong>Currently using:</strong> Local Storage (browser only)</p>
            <p style="margin-top: 8px; font-size: 13px; color: #666;">
              Enable cloud sync to access your words from any device and keep them backed up.
            </p>
          </div>

          <button @click="showSetup = true" class="btn-primary">
            Enable Cloud Sync
          </button>
        </div>

        <div v-else class="enabled-section">
          <div class="success-box">
            <p>✅ <strong>Cloud Sync Enabled</strong></p>
            <p style="margin-top: 5px; font-size: 13px;">
              Your words are synced to GitHub Gists and accessible from any device.
            </p>
          </div>

          <div class="button-group">
            <button @click="exportGistData" class="btn-primary" :disabled="exporting">
              {{ exporting ? 'Exporting...' : '📥 Export Gist to JSON' }}
            </button>
            <button @click="disableCloudSync" class="btn-secondary">
              Disable Cloud Sync
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header-with-toggle">
          <div>
            <h2 class="section-title">🗄️ Database Viewer</h2>
            <p class="section-desc">
              View your local storage, IndexedDB, and GitHub Gist database contents.
            </p>
          </div>
          <button @click="toggleDatabaseViewer" class="btn-toggle">
            {{ showDatabaseViewer ? '▼ Hide' : '▶ Show' }}
          </button>
        </div>

        <div v-if="showDatabaseViewer" class="database-viewer">
          <div v-if="loadingDatabase" class="loading-message">
            Loading database information...
          </div>
          
          <div v-else-if="databaseError" class="error-message">
            {{ databaseError }}
          </div>

          <div v-else-if="databaseInfo" class="db-content">
            <!-- LocalStorage Section -->
            <div class="db-section">
              <h3 class="db-section-title" @click="toggleSection('localStorage')">
                📦 LocalStorage ({{ databaseInfo.localStorage.itemCount }} items, {{ formatBytes(databaseInfo.localStorage.totalSize) }})
                <span class="toggle-icon">{{ expandedSections.localStorage ? '▼' : '▶' }}</span>
              </h3>
              <div v-if="expandedSections.localStorage" class="db-section-content">
                <div v-if="databaseInfo.localStorage.allItems.length === 0" class="db-item">
                  <p>No items in localStorage</p>
                </div>
                <div v-for="item in databaseInfo.localStorage.allItems" :key="item.key" class="db-item">
                  <strong>{{ item.key }}</strong> ({{ formatBytes(item.size) }})
                  <button @click="toggleFullDataForItem(item.key)" class="btn-link">
                    {{ expandedItems[item.key] ? 'Hide' : 'Show' }} full data
                  </button>
                  <pre v-if="expandedItems[item.key]" class="json-preview">{{ typeof item.value === 'object' ? JSON.stringify(item.value, null, 2) : item.value }}</pre>
                  <pre v-else class="json-preview">{{ item.preview }}</pre>
                </div>
              </div>
            </div>

            <!-- IndexedDB Section -->
            <div class="db-section">
              <h3 class="db-section-title" @click="toggleSection('indexedDB')">
                💾 IndexedDB ({{ databaseInfo.indexedDB.totalDatabases }} database{{ databaseInfo.indexedDB.totalDatabases !== 1 ? 's' : '' }})
                <span class="toggle-icon">{{ expandedSections.indexedDB ? '▼' : '▶' }}</span>
              </h3>
              <div v-if="expandedSections.indexedDB" class="db-section-content">
                <div v-if="databaseInfo.indexedDB.databases.length === 0" class="db-item">
                  <p>No IndexedDB databases found</p>
                </div>
                <div v-for="db in databaseInfo.indexedDB.databases" :key="db.name" class="db-database">
                  <h4 class="db-database-title" @click="toggleDatabase(db.name)">
                    🗄️ {{ db.name }} (v{{ db.version }}) - {{ db.stores.length }} store{{ db.stores.length !== 1 ? 's' : '' }}
                    <span class="toggle-icon">{{ expandedDatabases[db.name] ? '▼' : '▶' }}</span>
                  </h4>
                  <div v-if="expandedDatabases[db.name]" class="db-stores">
                    <div v-for="store in db.stores" :key="store.name" class="db-store">
                      <h5 class="db-store-title" @click="toggleStore(db.name, store.name)">
                        📋 {{ store.name }} ({{ store.keyCount }} keys)
                        <span class="toggle-icon">{{ expandedStores[`${db.name}.${store.name}`] ? '▼' : '▶' }}</span>
                      </h5>
                      <div v-if="expandedStores[`${db.name}.${store.name}`]" class="db-store-content">
                        <div class="db-item">
                          <strong>Keys:</strong> {{ store.keys.length }}
                          <pre class="json-preview">{{ JSON.stringify(store.keys.slice(0, 20), null, 2) }}{{ store.keys.length > 20 ? '\n... (' + (store.keys.length - 20) + ' more)' : '' }}</pre>
                        </div>
                        <div class="db-item">
                          <strong>Sample Data (first 10 entries):</strong>
                          <button @click="toggleFullDataForStore(db.name, store.name)" class="btn-link">
                            {{ expandedFullData[`${db.name}.${store.name}`] ? 'Hide' : 'Show' }} all data
                          </button>
                          <pre v-if="expandedFullData[`${db.name}.${store.name}`] && store.fullData" class="json-preview">{{ JSON.stringify(store.fullData, null, 2) }}</pre>
                          <pre v-else class="json-preview">{{ JSON.stringify(store.sampleData, null, 2) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GitHub Gist Section -->
            <div class="db-section">
              <h3 class="db-section-title" @click="toggleSection('githubGist')">
                ☁️ GitHub Gist ({{ databaseInfo.githubGist.totalGists }} gist{{ databaseInfo.githubGist.totalGists !== 1 ? 's' : '' }})
                <span class="toggle-icon">{{ expandedSections.githubGist ? '▼' : '▶' }}</span>
              </h3>
              <div v-if="expandedSections.githubGist" class="db-section-content">
                <div v-if="!databaseInfo.githubGist.enabled" class="db-item">
                  <p>Cloud sync is not enabled. Enable it in the Cloud Sync section above.</p>
                </div>
                <div v-else-if="databaseInfo.githubGist.allGists.length === 0" class="db-item">
                  <p>No GitHub Gists found</p>
                </div>
                <div v-for="gist in databaseInfo.githubGist.allGists" :key="gist.id" class="db-gist">
                  <h4 class="db-gist-title" @click="toggleGist(gist.id)">
                    📝 {{ gist.description || 'Untitled Gist' }} ({{ Object.keys(gist.files).length }} file{{ Object.keys(gist.files).length !== 1 ? 's' : '' }})
                    <span class="toggle-icon">{{ expandedGists[gist.id] ? '▼' : '▶' }}</span>
                  </h4>
                  <div v-if="expandedGists[gist.id]" class="db-gist-content">
                    <div class="db-item">
                      <p><strong>ID:</strong> {{ gist.id }}</p>
                      <p v-if="gist.url">
                        <strong>URL:</strong> 
                        <a :href="gist.url" target="_blank" class="link-button">
                          View on GitHub
                        </a>
                      </p>
                      <p v-if="gist.createdAt">
                        <strong>Created:</strong> {{ new Date(gist.createdAt).toLocaleString() }}
                      </p>
                      <p v-if="gist.updatedAt">
                        <strong>Updated:</strong> {{ new Date(gist.updatedAt).toLocaleString() }}
                      </p>
                    </div>
                    <div v-for="(file, filename) in gist.files" :key="filename" class="db-item">
                      <strong>📄 {{ filename }}</strong> ({{ formatBytes(file.size) }})
                      <button @click="toggleFullDataForGistFile(gist.id, filename)" class="btn-link">
                        {{ expandedGistFiles[`${gist.id}.${filename}`] ? 'Hide' : 'Show' }} full content
                      </button>
                      <pre v-if="expandedGistFiles[`${gist.id}.${filename}`] && gist.fullContent && gist.fullContent[filename]" class="json-preview">{{ gist.fullContent[filename] }}</pre>
                      <pre v-else class="json-preview">{{ file.preview }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="button-group" style="margin-top: 15px;">
            <button @click="refreshDatabaseInfo" class="btn-primary" :disabled="loadingDatabase">
              {{ loadingDatabase ? 'Loading...' : '🔄 Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- GitHub Setup (shown when enabling) -->
      <div v-if="showSetup" class="setup-form">
        <h3 class="setup-title">GitHub Setup</h3>
        <p class="setup-desc">
          You'll need a GitHub Personal Access Token to enable cloud sync.
        </p>

        <div class="instructions">
          <ol>
            <li>
              Go to 
              <a href="https://github.com/settings/tokens" target="_blank" class="link-button">
                GitHub Token Settings
              </a>
            </li>
            <li>Click "Generate new token (classic)"</li>
            <li>Give it a name (e.g., "Language Learner")</li>
            <li>Check <strong>ONLY</strong> the <strong>"gist"</strong> permission</li>
            <li>Click "Generate token" and copy it</li>
          </ol>
        </div>

        <div class="input-group">
          <label for="token">GitHub Personal Access Token:</label>
          <input
            id="token"
            v-model="token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            class="token-input"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="button-row">
          <button @click="showSetup = false" class="btn-secondary">
            Cancel
          </button>
          <button 
            @click="enableCloudSync" 
            class="btn-primary"
            :disabled="!token.trim() || saving"
          >
            {{ saving ? 'Saving...' : 'Enable Sync' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { saveGitHubToken, clearGitHubToken, exportGistToJSON } from '../utils/gistStorage'
import { syncLocalToCloud, isCloudSyncEnabled } from '../utils/wordStorage'
import { 
  getDailyGoal, 
  updateDailyGoal as updateGoal,
  syncStreakDataFromCloud 
} from '../utils/streakStorage'
import { 
  scheduleStreakNotifications, 
  cancelStreakNotifications,
  areNotificationsEnabled 
} from '../utils/notifications'
import { getDatabaseInfo, type DatabaseInfo } from '../utils/databaseViewer'
import StreakCalendar from './StreakCalendar.vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'manage-words'): void
}>()

const cloudEnabled = ref(false)
const showSetup = ref(false)
const token = ref('')
const error = ref('')
const saving = ref(false)
const exporting = ref(false)
const dailyGoal = ref(30)
const savingGoal = ref(false)
const notificationsEnabled = ref(false)

// Database viewer state
const showDatabaseViewer = ref(false)
const loadingDatabase = ref(false)
const databaseError = ref('')
const databaseInfo = ref<DatabaseInfo | null>(null)
const expandedSections = ref({
  localStorage: true,
  indexedDB: true,
  githubGist: true
})
const expandedItems = ref<Record<string, boolean>>({})
const expandedDatabases = ref<Record<string, boolean>>({})
const expandedStores = ref<Record<string, boolean>>({})
const expandedFullData = ref<Record<string, boolean>>({})
const expandedGists = ref<Record<string, boolean>>({})
const expandedGistFiles = ref<Record<string, boolean>>({})

onMounted(async () => {
  cloudEnabled.value = await isCloudSyncEnabled()
  dailyGoal.value = await getDailyGoal()
  notificationsEnabled.value = areNotificationsEnabled()
  
  // Sync streak data from cloud if enabled
  if (cloudEnabled.value) {
    await syncStreakDataFromCloud()
  }
})

const enableCloudSync = async () => {
  if (!token.value.trim()) {
    error.value = 'Please enter a token'
    return
  }

  saving.value = true
  error.value = ''

  try {
    // Test the token
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token.value.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    })

    if (!response.ok) {
      throw new Error('Invalid token. Please check your token and try again.')
    }

    // Save the token
    await saveGitHubToken(token.value.trim())
    
    // Sync existing local words to cloud
    try {
      await syncLocalToCloud()
    } catch (syncError) {
      console.warn('Failed to sync local words to cloud:', syncError)
      // Don't fail - token is saved, sync will happen on next save
    }

    cloudEnabled.value = true
    showSetup.value = false
    token.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to enable cloud sync'
    console.error('Error enabling cloud sync:', err)
  } finally {
    saving.value = false
  }
}

const disableCloudSync = async () => {
  if (confirm('Disable cloud sync? Your words will still be saved locally, but won\'t sync to the cloud.')) {
    await clearGitHubToken()
    cloudEnabled.value = false
  }
}

const exportGistData = async () => {
  exporting.value = true
  error.value = ''

  try {
    await exportGistToJSON()
    // Success - the download will happen automatically
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export Gist data'
    console.error('Error exporting Gist data:', err)
  } finally {
    exporting.value = false
  }
}

const updateDailyGoal = async () => {
  if (dailyGoal.value < 1 || dailyGoal.value > 1000) {
    error.value = 'Daily goal must be between 1 and 1000'
    return
  }
  
  savingGoal.value = true
  error.value = ''
  
  try {
    await updateGoal(dailyGoal.value)
    // Sync to service worker for notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_STORAGE',
        key: 'streak-daily-goal',
        value: dailyGoal.value.toString()
      })
    }
    // Success
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update daily goal'
    console.error('Error updating daily goal:', err)
  } finally {
    savingGoal.value = false
  }
}

const toggleNotifications = async () => {
  if (notificationsEnabled.value) {
    await scheduleStreakNotifications()
  } else {
    cancelStreakNotifications()
  }
}

const toggleDatabaseViewer = () => {
  showDatabaseViewer.value = !showDatabaseViewer.value
  if (showDatabaseViewer.value && !databaseInfo.value) {
    refreshDatabaseInfo()
  }
}

const refreshDatabaseInfo = async () => {
  loadingDatabase.value = true
  databaseError.value = ''
  
  try {
    databaseInfo.value = await getDatabaseInfo(false)
  } catch (err) {
    databaseError.value = err instanceof Error ? err.message : 'Failed to load database information'
    console.error('Error loading database info:', err)
  } finally {
    loadingDatabase.value = false
  }
}

const toggleSection = (section: 'localStorage' | 'indexedDB' | 'githubGist') => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const toggleFullDataForItem = (key: string) => {
  expandedItems.value[key] = !expandedItems.value[key]
}

const toggleDatabase = (dbName: string) => {
  expandedDatabases.value[dbName] = !expandedDatabases.value[dbName]
}

const toggleStore = (dbName: string, storeName: string) => {
  const key = `${dbName}.${storeName}`
  expandedStores.value[key] = !expandedStores.value[key]
}

const toggleFullDataForStore = async (dbName: string, storeName: string) => {
  const key = `${dbName}.${storeName}`
  expandedFullData.value[key] = !expandedFullData.value[key]
  
  // If showing full data, reload with full data
  if (expandedFullData.value[key] && databaseInfo.value) {
    await refreshDatabaseInfoWithFullData()
  }
}

const toggleGist = (gistId: string) => {
  expandedGists.value[gistId] = !expandedGists.value[gistId]
}

const toggleFullDataForGistFile = async (gistId: string, filename: string) => {
  const key = `${gistId}.${filename}`
  expandedGistFiles.value[key] = !expandedGistFiles.value[key]
  
  // If showing full data, reload with full data
  if (expandedGistFiles.value[key] && databaseInfo.value) {
    await refreshDatabaseInfoWithFullData()
  }
}

const refreshDatabaseInfoWithFullData = async () => {
  loadingDatabase.value = true
  databaseError.value = ''
  
  try {
    databaseInfo.value = await getDatabaseInfo(true)
  } catch (err) {
    databaseError.value = err instanceof Error ? err.message : 'Failed to load database information'
    console.error('Error loading database info:', err)
  } finally {
    loadingDatabase.value = false
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.settings-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.settings-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.back-btn {
  background: #f0f0f0;
  color: #333;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e0e0e0;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.section-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.info-box {
  background: #f8f9ff;
  border: 2px solid #667eea;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-box p {
  margin: 0;
  font-size: 14px;
  color: #555;
}

.success-box {
  background: #d4edda;
  border: 2px solid #28a745;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.success-box p {
  margin: 0;
  font-size: 14px;
  color: #155724;
}

.btn-primary {
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #764ba2;
  transform: scale(1.02);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.setup-form {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 2px solid #e0e0e0;
}

.setup-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
}

.setup-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.instructions {
  background: #fff9e6;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  font-size: 13px;
  color: #856404;
  line-height: 1.8;
  margin-bottom: 8px;
}

.link-button {
  display: inline-block;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.link-button:hover {
  background: #764ba2;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.token-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
}

.token-input:focus {
  outline: none;
  border-color: #667eea;
}

.button-row {
  display: flex;
  gap: 10px;
}

.button-row .btn-primary,
.button-row .btn-secondary {
  flex: 1;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-message {
  margin-bottom: 15px;
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 10px;
  font-size: 14px;
}

.setting-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 10px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.input-with-button {
  display: flex;
  gap: 10px;
  align-items: center;
}

.number-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  max-width: 150px;
}

.number-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-small {
  background: #667eea;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover:not(:disabled) {
  background: #764ba2;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-hint {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  margin-bottom: 0;
}

.toggle-setting {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.toggle-info {
  flex: 1;
}

.toggle-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.toggle-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #667eea;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.section-header-with-toggle {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.btn-toggle {
  background: #667eea;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-toggle:hover {
  background: #764ba2;
}

.database-viewer {
  margin-top: 15px;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
}

.loading-message {
  padding: 20px;
  text-align: center;
  color: #666;
}

.db-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.db-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}

.db-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.db-section-title:hover {
  background: #e0e0e0;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
}

.db-section-content {
  padding-top: 10px;
}

.db-item {
  margin-bottom: 15px;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.db-item strong {
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.db-item p {
  margin: 5px 0;
  font-size: 13px;
  color: #555;
}

.json-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  margin-left: 8px;
  font-weight: 600;
}

.btn-link:hover {
  color: #764ba2;
}

.db-database {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.db-database-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.db-database-title:hover {
  background: #f0f0f0;
}

.db-stores {
  margin-top: 10px;
  padding-left: 10px;
}

.db-store {
  margin-bottom: 10px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 2px solid #999;
}

.db-store-title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin: 0 0 8px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.db-store-title:hover {
  background: #f0f0f0;
}

.db-store-content {
  margin-top: 8px;
  padding-left: 10px;
}

.db-gist {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #28a745;
}

.db-gist-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.db-gist-title:hover {
  background: #f0f0f0;
}

.db-gist-content {
  margin-top: 10px;
  padding-left: 10px;
}
</style>

