<template>
  <div class="reading-container">
    <div class="reading-header">
      <button @click="$emit('back')" class="back-btn">← Back</button>
      <div class="reading-title">{{ content.moduleName }}</div>
      <div class="reading-progress">
        {{ currentLineIndex + 1 }} / {{ content.totalLines }}
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
    
    <div class="reading-content">
      <div class="line-card">
        <div class="line-number">Line {{ currentLine.lineNumber }}</div>
        <div class="german-text">{{ currentLine.original }}</div>
        <button 
          v-if="!showTranslation"
          @click="showTranslation = true"
          class="reveal-btn"
        >
          👁️ Show Translation
        </button>
        <transition name="fade">
          <div v-if="showTranslation" class="translation-text">
            {{ currentLine.translation }}
          </div>
        </transition>
      </div>
    </div>
    
    <div class="reading-controls">
      <button 
        @click="previousLine" 
        :disabled="currentLineIndex === 0"
        class="nav-btn"
      >
        ← Previous
      </button>
      <button 
        @click="nextLine" 
        :disabled="currentLineIndex === content.totalLines - 1"
        class="nav-btn primary"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { updateReadingProgress } from '../utils/readingStorage'
import type { ReadingContent } from '../types'

const props = defineProps<{
  content: ReadingContent
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

// Start from saved position
const currentLineIndex = ref(props.content.currentLineIndex || 0)
const showTranslation = ref(false)

const currentLine = computed(() => props.content.lines[currentLineIndex.value])

const progressPercent = computed(() => {
  return ((currentLineIndex.value + 1) / props.content.totalLines) * 100
})

// Save progress when line changes (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const saveProgress = async () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(async () => {
    try {
      await updateReadingProgress(props.content.moduleName, currentLineIndex.value)
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }, 500) // Save after 500ms of no changes
}

watch(() => currentLineIndex.value, () => {
  saveProgress()
})

const nextLine = () => {
  if (currentLineIndex.value < props.content.totalLines - 1) {
    currentLineIndex.value++
    showTranslation.value = false
  }
}

const previousLine = () => {
  if (currentLineIndex.value > 0) {
    currentLineIndex.value--
    showTranslation.value = false
  }
}
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.back-btn {
  background: none;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
  padding: 5px 0;
  border: none;
  cursor: pointer;
}

.reading-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reading-progress {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.progress-bar-container {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.reading-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.line-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
}

.line-number {
  font-size: 12px;
  color: #999;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.german-text {
  font-size: 20px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
  min-height: 80px;
}

.reveal-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: transform 0.2s;
}

.reveal-btn:active {
  transform: scale(0.98);
}

.translation-text {
  font-size: 18px;
  line-height: 1.6;
  color: #555;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.reading-controls {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.nav-btn {
  flex: 1;
  padding: 15px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #e0e0e0;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.nav-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

