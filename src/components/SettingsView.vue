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

onMounted(async () => {
  cloudEnabled.value = await isCloudSyncEnabled()
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
</style>

