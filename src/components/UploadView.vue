<template>
  <div class="upload-container">
    <div class="upload-card">
      <h1 class="title">📚 German Language Learner</h1>
      <p class="subtitle">Upload a German PDF or paste text to start learning</p>
      
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
        ></textarea>
        <button 
          @click="processText" 
          class="btn-primary"
          :disabled="!pastedText.trim() || processing"
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

      <div v-if="savedWordsCount > 0" class="saved-words-info">
        <p>You have {{ savedWordsCount }} saved words in cloud storage</p>
        <button @click="useSavedWords" class="btn-secondary">Use Saved Words</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { extractTextFromPDF } from '../utils/pdfParser'
import { extractWords } from '../utils/wordExtractor'
import { extractSentences } from '../utils/sentenceExtractor'
import { appendWordsToCloud, getAllWordsFromCloud, loadWordsFromCloud } from '../utils/cloudStorage'
import type { Word, Sentence } from '../types'

const emit = defineEmits<{
  (e: 'pdf-processed', data: { words: Word[], sentences: Sentence[], text: string }): void
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

// Check for saved words on mount
onMounted(async () => {
  const savedWords = await loadWordsFromCloud()
  savedWordsCount.value = savedWords.length
})

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

  processing.value = true
  processingMessage.value = 'Extracting text from PDF...'
  error.value = ''

  try {
    // Extract text from PDF
    const text = await extractTextFromPDF(file)
    
    if (!text || text.length < 50) {
      throw new Error('PDF appears to be empty or could not be read')
    }

    await processTextContent(text)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to process PDF'
    console.error('Error processing PDF:', err)
  } finally {
    processing.value = false
  }
}

const processText = async () => {
  if (!pastedText.value.trim()) {
    error.value = 'Please paste some text'
    return
  }

  processing.value = true
  processingMessage.value = 'Processing text...'
  error.value = ''

  try {
    await processTextContent(pastedText.value)
    pastedText.value = '' // Clear after processing
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to process text'
    console.error('Error processing text:', err)
  } finally {
    processing.value = false
  }
}

const processTextContent = async (text: string) => {
  processingMessage.value = 'Extracting and lemmatizing words...'
  
  // Extract words (this will check for duplicates and only translate new ones)
  const newWords = await extractWords(text)
  
  if (newWords.length === 0) {
    processingMessage.value = 'No new words found. All words may already exist in your collection.'
    // Still load existing words
    const allWords = await getAllWordsFromCloud()
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

  processingMessage.value = `Found ${newWords.length} new words. Saving to cloud...`
  
  // Append new words to cloud storage (this handles duplicates)
  const allWords = await appendWordsToCloud(newWords)
  
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

const useSavedWords = async () => {
  processing.value = true
  processingMessage.value = 'Loading words from cloud storage...'
  
  try {
    const saved = await getAllWordsFromCloud()
    const savedSentences: Sentence[] = [] // Sentences are not stored in cloud, will be regenerated if needed
    
    if (saved && saved.length > 0) {
      emit('pdf-processed', { 
        words: saved, 
        sentences: savedSentences,
        text: ''
      })
    } else {
      error.value = 'No saved words found'
    }
  } catch (err) {
    error.value = 'Failed to load saved words'
    console.error('Error loading saved words:', err)
  } finally {
    processing.value = false
  }
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

.saved-words-info {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #eee;
}

.saved-words-info p {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  padding: 12px 24px;
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
</style>
