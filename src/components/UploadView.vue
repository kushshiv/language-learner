<template>
  <div class="upload-container">
    <!-- Initial Choice View -->
    <div v-if="showInitialChoice" class="upload-card">
      <div class="header-row">
        <h1 class="title">📚 German Language Learner</h1>
        <button @click="$emit('open-settings')" class="settings-btn" title="Settings">
          ⚙️
        </button>
      </div>
      <p class="subtitle">What would you like to do?</p>
      
      <button 
        class="choice-btn practice-btn" 
        @click="startPracticing"
        :disabled="loadingWords"
      >
        <div class="choice-icon">🎯</div>
        <div class="choice-name">Start Practicing</div>
        <div class="choice-desc">Use your existing words</div>
        <div v-if="savedWordsCount > 0" class="word-count">{{ savedWordsCount }} words available</div>
      </button>

      <div class="divider">
        <span>OR</span>
      </div>

      <button 
        class="choice-btn upload-btn" 
        @click="handleUploadClick"
      >
        <div class="choice-icon">📄</div>
        <div class="choice-name">Upload New Content</div>
        <div class="choice-desc">Add PDF or paste text</div>
      </button>

      <div v-if="loadingWords" class="processing">
        <div class="spinner"></div>
        <p>Loading words...</p>
      </div>

      <div v-if="loadError" class="error-message">
        {{ loadError }}
      </div>
    </div>

    <!-- Upload/Text Input View -->
    <div v-else class="upload-card">
      <h1 class="title">📚 Upload New Content</h1>
      <p class="subtitle">Upload a German PDF or paste text to extract words</p>
      
      <button @click="showInitialChoice = true" class="btn-back">← Back</button>
      
      <div class="input-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: inputMode === 'pdf' }"
          @click="inputMode = 'pdf'"
        >
          📄 PDF Upload
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: inputMode === 'text' }"
          @click="inputMode = 'text'"
        >
          📝 Paste Text
        </button>
      </div>

      <!-- PDF Upload Mode -->
      <div v-if="inputMode === 'pdf'" class="upload-area" 
           :class="{ 'dragging': isDragging }" 
           @drop="handleDrop" 
           @dragover.prevent="isDragging = true"
           @dragleave="isDragging = false"
           @click="fileInput?.click()">
        <input 
          ref="fileInput"
          type="file" 
          accept=".pdf" 
          @change="handleFileSelect"
          style="display: none;"
        />
        <div class="upload-icon">📄</div>
        <p class="upload-text">Tap to upload PDF</p>
        <p class="upload-hint">or drag and drop</p>
      </div>

      <!-- Text Paste Mode -->
      <div v-else class="text-input-area">
        <textarea
          ref="textInput"
          v-model="pastedText"
          placeholder="Paste your German text here..."
          class="text-input"
          rows="8"
          maxlength="10000"
        ></textarea>
        <div class="char-counter">
          {{ pastedText.length }} / {{ MAX_TEXT_CHARACTERS }} characters
        </div>
        <button 
          @click="processText" 
          class="btn-primary"
          :disabled="!pastedText.trim() || processing || pastedText.length > MAX_TEXT_CHARACTERS"
        >
          Process Text
        </button>
      </div>

      <div v-if="processing" class="processing">
        <div class="spinner"></div>
        <p>{{ processingMessage }}</p>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- Warning Modal -->
    <div v-if="showWarningModal" class="modal-overlay" @click.self="showWarningModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>⚠️ Important Notice</h2>
        </div>
        <div class="modal-body">
          <p><strong>Please use this app responsibly!</strong></p>
          <p>I use this app daily for my personal learning. The translation and lemmatization services rely on external APIs with rate limits.</p>
          <ul>
            <li>📄 <strong>PDF Limit:</strong> Maximum 50 pages per upload</li>
            <li>📝 <strong>Text Limit:</strong> Maximum 10,000 characters per upload</li>
            <li>⏱️ <strong>Rate Limits:</strong> Heavy usage may interrupt my personal use</li>
          </ul>
          <p>Please avoid uploading very large PDFs or extremely long texts. Use it wisely so I can continue using it for my daily learning! 🙏</p>
        </div>
        <div class="modal-footer">
          <button 
            v-if="pendingFile || pendingText"
            @click="showWarningModal = false; proceedWithUpload()" 
            class="btn-primary"
          >
            I Understand, Continue
          </button>
          <button 
            v-else
            @click="handleWarningContinue" 
            class="btn-primary"
          >
            I Understand, Continue
          </button>
          <button 
            @click="showWarningModal = false; cancelUpload()" 
            class="btn-secondary"
          >
            {{ pendingFile || pendingText ? 'Cancel' : 'Go Back' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPDFInfo } from '../utils/pdfParser'
import { extractWords } from '../utils/wordExtractor'
import { extractSentences } from '../utils/sentenceExtractor'
import { getAllWords, appendWords, isCloudSyncEnabled } from '../utils/wordStorage'
import type { Word, Sentence } from '../types'

// Limits
const MAX_PDF_PAGES = 50
const MAX_TEXT_CHARACTERS = 10000

const emit = defineEmits<{
  (e: 'pdf-processed', data: { words: Word[], sentences: Sentence[], text: string }): void
  (e: 'start-practicing', data: { words: Word[] }): void
  (e: 'open-settings'): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const textInput = ref<HTMLTextAreaElement | null>(null)
const isDragging = ref(false)
const processing = ref(false)
const processingMessage = ref('Processing...')
const error = ref('')
const savedWordsCount = ref(0)
const inputMode = ref<'pdf' | 'text'>('pdf')
const pastedText = ref('')
const showInitialChoice = ref(true)
const loadingWords = ref(false)
const loadError = ref('')
const showWarningModal = ref(false)
const pendingFile = ref<File | null>(null)
const pendingText = ref<string | null>(null)
const hasSeenWarning = ref(false)

// Check for saved words on mount
onMounted(async () => {
  await checkSavedWords()
})

const checkSavedWords = async () => {
  try {
    const savedWords = await getAllWords()
    savedWordsCount.value = savedWords.length
  } catch (err) {
    console.error('Error checking saved words:', err)
  }
}

const startPracticing = async () => {
  loadingWords.value = true
  loadError.value = ''
  
  try {
    const savedWords = await getAllWords()
    if (savedWords && savedWords.length > 0) {
      emit('start-practicing', { words: savedWords })
    } else {
      loadError.value = 'No words found. Please upload a PDF or paste text first.'
    }
  } catch (err) {
    loadError.value = 'Failed to load words.'
    console.error('Error loading words:', err)
  } finally {
    loadingWords.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  if (file.type !== 'application/pdf') {
    error.value = 'Please upload a PDF file'
    return
  }

  error.value = ''
  processing.value = true
  processingMessage.value = 'Checking PDF...'

  try {
    // Get PDF info (page count and text)
    const pdfInfo = await getPDFInfo(file)
    
    // Check page limit
    if (pdfInfo.pageCount > MAX_PDF_PAGES) {
      processing.value = false
      error.value = `PDF has ${pdfInfo.pageCount} pages. Maximum allowed is ${MAX_PDF_PAGES} pages. Please upload a smaller PDF.`
      return
    }

    if (!pdfInfo.text || pdfInfo.text.length < 50) {
      processing.value = false
      throw new Error('PDF appears to be empty or could not be read')
    }

    // Show warning modal before processing
    pendingFile.value = file
    processing.value = false
    showWarningModal.value = true
  } catch (err) {
    processing.value = false
    error.value = err instanceof Error ? err.message : 'Failed to process PDF'
    console.error('Error processing PDF:', err)
  }
}

const proceedWithUpload = async () => {
  if (pendingFile.value) {
    processing.value = true
    processingMessage.value = 'Extracting text from PDF...'
    
    try {
      const pdfInfo = await getPDFInfo(pendingFile.value)
      await processTextContent(pdfInfo.text)
      pendingFile.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process PDF'
      console.error('Error processing PDF:', err)
    } finally {
      processing.value = false
    }
  } else if (pendingText.value) {
    processing.value = true
    processingMessage.value = 'Processing text...'
    
    try {
      await processTextContent(pendingText.value)
      pastedText.value = ''
      pendingText.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process text'
      console.error('Error processing text:', err)
    } finally {
      processing.value = false
    }
  }
}

const cancelUpload = () => {
  pendingFile.value = null
  pendingText.value = null
  showWarningModal.value = false
}

const handleUploadClick = () => {
  if (!hasSeenWarning.value) {
    showWarningModal.value = true
  } else {
    showInitialChoice.value = false
  }
}

const handleWarningContinue = () => {
  hasSeenWarning.value = true
  showWarningModal.value = false
  showInitialChoice.value = false
}

const processText = async () => {
  if (!pastedText.value.trim()) {
    error.value = 'Please paste some text'
    return
  }

  // Check character limit
  if (pastedText.value.length > MAX_TEXT_CHARACTERS) {
    error.value = `Text is too long (${pastedText.value.length} characters). Maximum allowed is ${MAX_TEXT_CHARACTERS} characters.`
    return
  }

  error.value = ''
  
  // Show warning modal before processing
  pendingText.value = pastedText.value
  showWarningModal.value = true
}

const processTextContent = async (text: string) => {
  processingMessage.value = 'Extracting and lemmatizing words...'
  
  // Extract words (this will check for duplicates and only translate new ones)
  const newWords = await extractWords(text)
  
  if (newWords.length === 0) {
    processingMessage.value = 'No new words found. All words may already exist in your collection.'
    // Still load existing words
    const allWords = await getAllWords()
    if (allWords.length > 0) {
      const wordDict = new Map<string, Word>()
      allWords.forEach(word => {
        wordDict.set(word.german.toLowerCase(), word)
      })
      const sentences = await extractSentences(text, wordDict)
      emit('pdf-processed', { words: allWords, sentences, text })
      return
    }
    throw new Error('No words could be extracted from the text')
  }

  const cloudEnabled = await isCloudSyncEnabled()
  processingMessage.value = cloudEnabled 
    ? `Found ${newWords.length} new words. Saving to cloud...`
    : `Found ${newWords.length} new words. Saving locally...`
  
  // Append new words (this handles duplicates and saves to both local and cloud if enabled)
  const allWords = await appendWords(newWords)
  
  processingMessage.value = 'Extracting sentences...'
  
  // Create word dictionary for sentence extraction
  const wordDict = new Map<string, Word>()
  allWords.forEach(word => {
    wordDict.set(word.german.toLowerCase(), word)
  })

  // Extract sentences
  const sentences = await extractSentences(text, wordDict)
  
  // Update saved words count
  savedWordsCount.value = allWords.length

  emit('pdf-processed', { words: allWords, sentences, text })
}
</script>

<style scoped>
.upload-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.upload-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.input-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.tab-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.upload-area {
  border: 3px dashed #667eea;
  border-radius: 15px;
  padding: 40px 20px;
  margin: 20px 0;
  background: #f8f9ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area.dragging {
  border-color: #764ba2;
  background: #f0f0ff;
  transform: scale(1.02);
}

.upload-area:active {
  transform: scale(0.98);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.upload-text {
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 14px;
  color: #999;
}

.text-input-area {
  margin: 20px 0;
}

.text-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary {
  margin-top: 15px;
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

.processing {
  margin-top: 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background: #fee;
  color: #c33;
  border-radius: 10px;
  font-size: 14px;
}

.choice-btn {
  background: white;
  border: 3px solid #e0e0e0;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 20px;
  cursor: pointer;
}

.choice-btn.practice-btn:hover:not(:disabled),
.choice-btn.practice-btn:active:not(:disabled) {
  border-color: #4caf50;
  background: #f1f8f4;
  transform: scale(1.02);
}

.choice-btn.upload-btn:hover,
.choice-btn.upload-btn:active {
  border-color: #667eea;
  background: #f8f9ff;
  transform: scale(1.02);
}

.choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.choice-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.choice-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.choice-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.word-count {
  font-size: 12px;
  color: #4caf50;
  font-weight: 600;
  margin-top: 5px;
}

.divider {
  text-align: center;
  margin: 25px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 14px;
  font-weight: 600;
}

.btn-back {
  background: #f0f0f0;
  color: #333;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #e0e0e0;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.settings-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: #f0f0f0;
  transform: rotate(90deg);
}

.char-counter {
  font-size: 12px;
  color: #666;
  text-align: right;
  margin-top: 5px;
  margin-bottom: 10px;
}

.char-counter:has-text {
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: calc(100% - 40px);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 0 auto;
}

.modal-header {
  padding: 25px 30px 15px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.modal-body {
  padding: 25px 30px;
}

.modal-body p {
  margin: 0 0 15px;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
}

.modal-body ul {
  margin: 15px 0;
  padding-left: 25px;
}

.modal-body li {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.modal-footer {
  padding: 20px 30px 30px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #eee;
}

.modal-footer .btn-primary,
.modal-footer .btn-secondary {
  flex: 1;
  margin: 0;
}
</style>
