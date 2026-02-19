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
</style>

