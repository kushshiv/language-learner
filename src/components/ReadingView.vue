<template>
  <div class="reading-container">
    <div class="reading-header">
      <button @click="$emit('back')" class="back-btn">← Back</button>
      <div class="progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ totalSentences }}</div>
      </div>
    </div>

    <div v-if="sentences.length > 0 && currentSentence" class="reading-content">
      <div class="sentence-card">
        <div class="sentence-original">
          <span
            v-for="(part, index) in highlightedParts"
            :key="index"
            :class="['sentence-part', { 'highlighted': part.isWord, 'word-tooltip': part.isWord }]"
            @click="part.isWord ? showWordMeaning(part.word!) : null"
            :title="part.isWord ? part.word?.english : ''"
          >
            {{ part.text }}
          </span>
        </div>

        <div class="sentence-translation">
          <div class="translation-label">📖 Translation:</div>
          <div class="translation-text">{{ currentSentence.translation }}</div>
        </div>

        <div v-if="selectedWord" class="word-detail">
          <div class="word-detail-header">
            <span class="word-german">{{ selectedWord.german }}</span>
            <span class="word-type">{{ selectedWord.type }}</span>
          </div>
          <div class="word-english">{{ selectedWord.english }}</div>
          <div v-if="selectedWord.example" class="word-example">
            Example: {{ selectedWord.example }}
          </div>
        </div>
      </div>

      <div class="navigation">
        <button 
          @click="previousSentence" 
          :disabled="currentIndex === 0"
          class="nav-btn prev"
        >
          ← Previous
        </button>
        <button 
          @click="nextSentence" 
          :disabled="currentIndex >= totalSentences - 1"
          class="nav-btn next"
        >
          Next →
        </button>
      </div>
    </div>

    <div v-else-if="!sentences || sentences.length === 0" class="error-state">
      <div class="error-icon">📚</div>
      <h2>No Sentences Available</h2>
      <p>It looks like sentences haven't been extracted yet.</p>
      <p class="error-hint">Please upload a new PDF to enable reading mode.</p>
      <button @click="$emit('back')" class="back-to-menu-btn">
        Go Back
      </button>
    </div>
    <div v-else class="loading">
      <div class="spinner"></div>
      <p>Loading reading mode...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Sentence, Word } from '../types'

const props = defineProps<{
  sentences: Sentence[]
  words: Word[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const currentIndex = ref(0)
const selectedWord = ref<Word | null>(null)

const currentSentence = computed(() => {
  return props.sentences[currentIndex.value]
})

const totalSentences = computed(() => props.sentences?.length || 0)

const progressPercent = computed(() => {
  return ((currentIndex.value + 1) / totalSentences.value) * 100
})

// Create word dictionary for quick lookup
const wordDictionary = computed(() => {
  const dict = new Map<string, Word>()
  props.words.forEach(word => {
    dict.set(word.german.toLowerCase(), word)
  })
  return dict
})

interface HighlightedPart {
  text: string
  isWord: boolean
  word?: Word
}

const highlightedParts = computed((): HighlightedPart[] => {
  if (!currentSentence.value) return []

  const sentence = currentSentence.value.original
  const parts: HighlightedPart[] = []
  let currentIndex = 0

  // Split sentence into words and punctuation
  const tokens = sentence.split(/(\s+|[.,!?;:()""''])/)
  
  for (const token of tokens) {
    if (!token.trim()) {
      parts.push({ text: token, isWord: false })
      continue
    }

    const cleanToken = token.replace(/[^\wäöüÄÖÜß]/g, '').toLowerCase()
    const word = wordDictionary.value.get(cleanToken)

    if (word && cleanToken.length >= 3) {
      // This is a known word - highlight it
      parts.push({
        text: token,
        isWord: true,
        word: word
      })
    } else {
      // Regular text
      parts.push({ text: token, isWord: false })
    }
  }

  return parts
})

const showWordMeaning = (word: Word) => {
  selectedWord.value = selectedWord.value?.german === word.german ? null : word
}

const nextSentence = () => {
  if (currentIndex.value < totalSentences.value - 1) {
    currentIndex.value++
    selectedWord.value = null
    // Scroll to top of sentence card
    const card = document.querySelector('.sentence-card')
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const previousSentence = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    selectedWord.value = null
    // Scroll to top of sentence card
    const card = document.querySelector('.sentence-card')
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

// Keyboard navigation
onMounted(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      nextSentence()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      previousSentence()
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress)
  }
})
</script>

<style scoped>
.reading-container {
  width: 100%;
  max-width: 600px;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.reading-header {
  background: white;
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: none;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
  padding: 5px 0;
  margin-bottom: 10px;
}

.progress {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.reading-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sentence-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
  flex: 1;
}

.sentence-original {
  font-size: 24px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 25px;
  text-align: left;
  min-height: 120px;
}

.sentence-part {
  display: inline;
  transition: all 0.2s ease;
}

.sentence-part.highlighted {
  background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  position: relative;
  transition: all 0.2s ease;
}

.sentence-part.highlighted:active {
  transform: scale(0.95);
}

.sentence-part.highlighted:hover {
  background: linear-gradient(120deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.sentence-translation {
  background: #f8f9ff;
  border-left: 4px solid #667eea;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}

.translation-label {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.translation-text {
  font-size: 18px;
  line-height: 1.6;
  color: #444;
}

.word-detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  margin-top: 20px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.word-detail-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.word-german {
  font-size: 24px;
  font-weight: 700;
}

.word-type {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.word-english {
  font-size: 20px;
  margin-bottom: 10px;
  opacity: 0.95;
}

.word-example {
  font-size: 14px;
  opacity: 0.9;
  font-style: italic;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.navigation {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.nav-btn {
  flex: 1;
  background: white;
  color: #667eea;
  padding: 15px 25px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #667eea;
  transition: all 0.3s ease;
}

.nav-btn:not(:disabled):hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 50px 20px;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 50px 20px;
  color: white;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-state h2 {
  font-size: 24px;
  margin-bottom: 15px;
  color: white;
}

.error-state p {
  font-size: 16px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.error-hint {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 20px;
}

.back-to-menu-btn {
  background: white;
  color: #667eea;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 30px;
  border: 2px solid white;
}
</style>

