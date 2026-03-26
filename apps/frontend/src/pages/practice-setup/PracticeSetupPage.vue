<template>
  <div class="difficulty-container">
    <div class="difficulty-card">
      <h1 class="title">Choose Quiz Mode</h1>
      <p class="subtitle">How would you like to practice?</p>
      
      <!-- Mode Selector -->
      <div class="mode-selector">
        <button 
          class="mode-tab"
          :class="{ active: quizMode === 'difficulty' }"
          @click="quizMode = 'difficulty'"
        >
          By Difficulty
        </button>
        <button 
          class="mode-tab"
          :class="{ active: quizMode === 'type' }"
          @click="quizMode = 'type'"
        >
          By Word Type
        </button>
      </div>

      <!-- Difficulty Mode -->
      <div v-if="quizMode === 'difficulty'" class="mode-content">
        <p class="quiz-title">Choose Difficulty Level</p>
        <div class="difficulty-options">
          <button 
            class="difficulty-btn easy" 
            @click="selectDifficulty('easy')"
          >
            <div class="difficulty-icon">🌱</div>
            <div class="difficulty-name">Easy</div>
            <div class="difficulty-desc">10 words per quiz</div>
          </button>

          <button 
            class="difficulty-btn medium" 
            @click="selectDifficulty('medium')"
          >
            <div class="difficulty-icon">🌿</div>
            <div class="difficulty-name">Medium</div>
            <div class="difficulty-desc">20 words per quiz</div>
          </button>

          <button 
            class="difficulty-btn hard" 
            @click="selectDifficulty('hard')"
          >
            <div class="difficulty-icon">🌳</div>
            <div class="difficulty-name">Hard</div>
            <div class="difficulty-desc">30 words per quiz</div>
          </button>
        </div>
      </div>

      <!-- Type Mode -->
      <div v-if="quizMode === 'type'" class="mode-content">
        <p class="quiz-title">Choose Word Type</p>
        <div v-if="availableTypes.length" class="type-options">
          <button
            v-for="type in availableTypes"
            :key="type"
            class="type-btn"
            @click="selectType(type)"
          >
            <div class="type-icon">🔤</div>
            <div class="type-name">{{ formatTypeLabel(type) }}</div>
            <div class="type-desc">{{ typeCounts[type] }} words available</div>
          </button>
        </div>
        <p v-else class="chunk-info">
          No word types found yet. Try uploading words first.
        </p>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Repeated Practice -->
      <div v-if="allWords.length > 0" class="repeated-practice-section">
        <p class="quiz-title">Repeated Practice (Fixed 20 Words per Chunk)</p>
        <p class="chunk-info">
          Select a 20-word range to practice repeatedly.
        </p>

        <div class="chunk-select-row">
          <label class="chunk-label" for="repeated-chunk-select">Choose chunk:</label>
          <select
            id="repeated-chunk-select"
            v-model.number="selectedRepeatedChunk"
            class="chunk-select"
          >
            <option
              v-for="chunkIndex in totalRepeatedChunks"
              :key="chunkIndex"
              :value="chunkIndex"
            >
              Chunk {{ chunkIndex }} ({{ (chunkIndex - 1) * REPEATED_CHUNK_SIZE + 1 }}–{{ Math.min(chunkIndex * REPEATED_CHUNK_SIZE, allWords.length) }})
            </option>
          </select>
        </div>

        <button
          @click="startRepeatedPractice"
          class="repeated-practice-btn"
        >
          <div class="repeated-practice-icon">🔄</div>
          <div class="repeated-practice-name">Repeated Practice</div>
          <div class="repeated-practice-desc">Practice Chunk {{ selectedRepeatedChunk }} (20 words, same set each time)</div>
        </button>
      </div>

      <div v-if="totalChunks > 0 || (allWords.length > 0)" class="divider">
        <span>OR</span>
      </div>

      <!-- Chunk Selection for Practice All -->
      <div v-if="totalChunks > 0" class="chunk-selection-section">
        <p class="quiz-title">Practice All Words (in chunks of 100)</p>
        <p class="chunk-info">
          You have {{ allWords.length }} words, split into {{ totalChunks }} chunks.
        </p>

        <div class="chunk-select-row">
          <label class="chunk-label" for="chunk-select">Choose chunk:</label>
          <select
            id="chunk-select"
            v-model.number="selectedChunk"
            class="chunk-select"
          >
            <option
              v-for="chunkIndex in totalChunks"
              :key="chunkIndex"
              :value="chunkIndex"
            >
              Chunk {{ chunkIndex }} ({{ (chunkIndex - 1) * CHUNK_SIZE + 1 }}–{{ Math.min(chunkIndex * CHUNK_SIZE, allWords.length) }})
            </option>
          </select>
        </div>

        <button
          @click="startChunkPractice"
          class="practice-all-btn"
        >
          Practice Chunk {{ selectedChunk }}
        </button>
      </div>

      <button @click="$emit('upload-new')" class="btn-secondary">
        Upload New PDF
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllWords } from '../../features/words/lib/wordStorage'
import type { Word } from '../../shared/types'

const emit = defineEmits<{
  (e: 'difficulty-selected', difficulty: 'easy' | 'medium' | 'hard'): void
  (e: 'type-selected', type: string): void
  (e: 'practice-all', chunkNumber: number): void
  (e: 'repeated-practice-selected', chunkNumber: number): void
  (e: 'upload-new'): void
}>()

const quizMode = ref<'difficulty' | 'type'>('difficulty')
const allWords = ref<Word[]>([])

// Dynamic word types and counts based on loaded words
const typeCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const w of allWords.value) {
    if (!w.type) continue
    const key = String(w.type).trim().toLowerCase()
    if (!key) continue
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
})

const availableTypes = computed(() => Object.keys(typeCounts.value).sort())

const formatTypeLabel = (type: string) => {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const selectDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
  emit('difficulty-selected', difficulty)
}

const selectType = (type: string) => {
  emit('type-selected', type)
}

// Chunk selection logic
const CHUNK_SIZE = 100
const REPEATED_CHUNK_SIZE = 20

const totalChunks = computed(() => {
  return Math.ceil(allWords.value.length / CHUNK_SIZE)
})

const totalRepeatedChunks = computed(() => {
  return Math.ceil(allWords.value.length / REPEATED_CHUNK_SIZE)
})

const selectedChunk = ref(1)
const selectedRepeatedChunk = ref(1)

const startChunkPractice = () => {
  if (totalChunks.value === 0) return
  const clampedChunk = Math.min(Math.max(selectedChunk.value || 1, 1), totalChunks.value)
  emit('practice-all', clampedChunk)
}

const startRepeatedPractice = () => {
  if (totalRepeatedChunks.value === 0) return
  const clampedChunk = Math.min(Math.max(selectedRepeatedChunk.value || 1, 1), totalRepeatedChunks.value)
  emit('repeated-practice-selected', clampedChunk)
}

// Load words on mount to get counts
onMounted(async () => {
  try {
    allWords.value = await getAllWords()
  } catch (error) {
    console.error('Failed to load words:', error)
    allWords.value = []
  }
})
</script>

<style scoped>
.difficulty-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.difficulty-card {
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

.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.difficulty-btn {
  background: white;
  border: 3px solid #e0e0e0;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
}

.difficulty-btn.easy:hover,
.difficulty-btn.easy:active {
  border-color: #4caf50;
  background: #f1f8f4;
  transform: scale(1.02);
}

.difficulty-btn.medium:hover,
.difficulty-btn.medium:active {
  border-color: #ff9800;
  background: #fff8f1;
  transform: scale(1.02);
}

.difficulty-btn.hard:hover,
.difficulty-btn.hard:active {
  border-color: #f44336;
  background: #fff5f5;
  transform: scale(1.02);
}

.difficulty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.difficulty-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.difficulty-desc {
  font-size: 14px;
  color: #666;
}

.mode-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  background: #f5f5f5;
  padding: 5px;
  border-radius: 12px;
}

.mode-tab {
  flex: 1;
  background: transparent;
  color: #666;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
}

.mode-tab.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-content {
  margin-bottom: 20px;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.type-btn {
  background: white;
  border: 3px solid #e0e0e0;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
}

.type-btn.verb:hover,
.type-btn.verb:active {
  border-color: #2196f3;
  background: #e3f2fd;
  transform: scale(1.02);
}

.type-btn.noun:hover,
.type-btn.noun:active {
  border-color: #9c27b0;
  background: #f3e5f5;
  transform: scale(1.02);
}

.type-btn.adjective:hover,
.type-btn.adjective:active {
  border-color: #ff9800;
  background: #fff3e0;
  transform: scale(1.02);
}

.type-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.type-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.type-desc {
  font-size: 14px;
  color: #666;
}

.quiz-title {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-bottom: 15px;
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

.practice-all-btn {
  background: white;
  border: 3px solid #667eea;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 20px;
  cursor: pointer;
}

.practice-all-btn:hover,
.practice-all-btn:active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.02);
}

.practice-all-btn:hover .practice-all-name,
.practice-all-btn:hover .practice-all-desc {
  color: white;
}

.practice-all-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.practice-all-name {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.practice-all-desc {
  font-size: 14px;
  color: #666;
}

.repeated-practice-btn {
  background: white;
  border: 3px solid #667eea;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 20px;
  cursor: pointer;
}

.repeated-practice-btn:hover,
.repeated-practice-btn:active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.02);
}

.repeated-practice-btn:hover .repeated-practice-name,
.repeated-practice-btn:hover .repeated-practice-desc {
  color: white;
}

.repeated-practice-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.repeated-practice-name {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.repeated-practice-desc {
  font-size: 14px;
  color: #666;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  margin-top: 20px;
}

.chunk-selection-section {
  margin-bottom: 20px;
}

.chunk-info {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
  text-align: center;
}

.chunk-select-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.chunk-label {
  font-size: 14px;
  color: #666;
}

.chunk-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #667eea;
  font-size: 14px;
  min-width: 180px;
}

.repeated-practice-section {
  margin-bottom: 20px;
}
</style>

