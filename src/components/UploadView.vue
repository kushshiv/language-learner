<template>
  <div class="upload-container">
    <div class="upload-card">
      <h1 class="title">📚 German Language Learner</h1>
      <p class="subtitle">Upload a German PDF to start learning</p>
      
      <div class="upload-area" :class="{ 'dragging': isDragging }" 
           @drop="handleDrop" 
           @dragover.prevent="isDragging = true"
           @dragleave="isDragging = false"
           @click="fileInput?.click()">
        <input 
          ref="fileInput"
          type="file" 
          accept=".pdf" 
          @change="handleFileSelect"
        />
        <div class="upload-icon">📄</div>
        <p class="upload-text">Tap to upload PDF</p>
        <p class="upload-hint">or drag and drop</p>
      </div>

      <div v-if="processing" class="processing">
        <div class="spinner"></div>
        <p>Processing PDF... This may take a moment</p>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="savedWordsCount > 0" class="saved-words-info">
        <p>You have {{ savedWordsCount }} saved words</p>
        <button @click="useSavedWords" class="btn-secondary">Use Saved Words</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { extractTextFromPDF } from '../utils/pdfParser'
import { extractWords } from '../utils/wordExtractor'
import { extractSentences } from '../utils/sentenceExtractor'
import { loadWords, saveWords, saveSentences, savePdfText } from '../utils/storage'
import type { Word, Sentence } from '../types'

const emit = defineEmits<{
  (e: 'pdf-processed', data: { words: Word[], sentences: Sentence[], text: string }): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const savedWordsCount = ref(0)

// Check for saved words on mount
const savedWords = loadWords()
if (savedWords) {
  savedWordsCount.value = savedWords.length
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

  processing.value = true
  error.value = ''

  try {
    // Extract text from PDF
    const text = await extractTextFromPDF(file)
    
    if (!text || text.length < 50) {
      throw new Error('PDF appears to be empty or could not be read')
    }

    // Extract words
    const words = await extractWords(text)
    
    if (words.length === 0) {
      throw new Error('No words could be extracted from the PDF')
    }

    // Create word dictionary for sentence extraction
    const wordDict = new Map<string, Word>()
    words.forEach(word => {
      wordDict.set(word.german.toLowerCase(), word)
    })

    // Extract sentences
    const sentences = await extractSentences(text, wordDict)
    
    // Save everything
    saveWords(words)
    savePdfText(text)
    if (sentences.length > 0) {
      saveSentences(sentences)
    }

    emit('pdf-processed', { words, sentences, text })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to process PDF'
    console.error('Error processing PDF:', err)
  } finally {
    processing.value = false
  }
}

const useSavedWords = () => {
  const saved = loadWords()
  const savedSentences = loadSentences()
  const savedText = loadPdfText()
  
  if (saved) {
    emit('pdf-processed', { 
      words: saved, 
      sentences: savedSentences || [],
      text: savedText || ''
    })
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
}
</style>

