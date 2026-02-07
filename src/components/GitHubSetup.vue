<template>
  <div class="setup-container">
    <div class="setup-card">
      <h1 class="title">🔐 GitHub Setup</h1>
      <p class="subtitle">Connect your GitHub account to store your words</p>
      
      <div class="info-box">
        <p class="info-text">
          <strong>Welcome! 👋</strong> This app uses GitHub Gists (free) to store your German words. 
          You'll need a GitHub account and a Personal Access Token to get started.
        </p>
        <p class="info-text" style="margin-top: 10px; font-size: 13px;">
          ⚡ <strong>Quick Setup:</strong> Takes less than 2 minutes. You only need to do this once!
        </p>
      </div>

      <div class="instructions">
        <h3>📋 Step-by-Step Instructions:</h3>
        <ol>
          <li>
            <strong>Open GitHub Settings:</strong>
            <br>
            <a href="https://github.com/settings/tokens" target="_blank" class="link-button">
              🔗 Open GitHub Token Settings
            </a>
          </li>
          <li>Click <strong>"Generate new token (classic)"</strong></li>
          <li>Give it a name (e.g., "Language Learner" or "German App")</li>
          <li>Check <strong>ONLY</strong> the <strong>"gist"</strong> permission (scroll down to find it)</li>
          <li>Click <strong>"Generate token"</strong> at the bottom</li>
          <li><strong>Copy the token immediately</strong> (you won't see it again!) - it starts with <code>ghp_</code></li>
          <li>Paste it in the field below and click "Save Token"</li>
        </ol>
        
        <div class="help-box">
          <p><strong>💡 Don't have a GitHub account?</strong></p>
          <p>Create a free account at <a href="https://github.com/signup" target="_blank">github.com/signup</a> (takes 1 minute)</p>
        </div>
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

      <button 
        @click="saveToken" 
        class="btn-primary"
        :disabled="!token.trim() || saving"
      >
        {{ saving ? 'Saving...' : 'Save Token' }}
      </button>

      <p class="privacy-note">
        🔒 Your token is stored locally in your browser. It's never sent to any server except GitHub.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { saveGitHubToken, isGitHubConfigured } from '../utils/gistStorage'

const emit = defineEmits<{
  (e: 'token-saved'): void
}>()

const token = ref('')
const error = ref('')
const saving = ref(false)

// Check if already configured
onMounted(async () => {
  if (await isGitHubConfigured()) {
    emit('token-saved')
  }
})

const saveToken = async () => {
  if (!token.value.trim()) {
    error.value = 'Please enter a token'
    return
  }

  saving.value = true
  error.value = ''

  try {
    // Test the token by making a simple API call
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
    emit('token-saved')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to verify token'
    console.error('Error saving token:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.setup-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.setup-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
}

.info-box {
  background: #f8f9ff;
  border: 2px solid #667eea;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 25px;
}

.info-text {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.instructions {
  margin-bottom: 25px;
}

.instructions h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.instructions ol {
  margin-left: 20px;
  padding-left: 10px;
}

.instructions li {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 8px;
}

.instructions a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.instructions a:hover {
  text-decoration: underline;
}

.link-button {
  display: inline-block;
  margin-top: 5px;
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
}

.link-button:hover {
  background: #764ba2;
  transform: translateY(-1px);
}

.instructions code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
}

.help-box {
  margin-top: 20px;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
}

.help-box p {
  margin: 5px 0;
  font-size: 13px;
  color: #856404;
}

.help-box a {
  color: #667eea;
  font-weight: 600;
}

.instructions strong {
  color: #333;
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

.error-message {
  margin-bottom: 15px;
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 10px;
  font-size: 14px;
}

.privacy-note {
  margin-top: 20px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>

