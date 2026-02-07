<template>
  <div class="app-container">
    <div v-if="currentView === 'settings'" class="view-container">
      <SettingsView 
        @back="currentView = 'upload'"
        @manage-words="currentView = 'word-manager'"
      />
    </div>
    <div v-else-if="currentView === 'word-manager'" class="view-container">
      <WordManagerView @back="currentView = 'settings'" />
    </div>
    <div v-else-if="currentView === 'upload'" class="view-container">
      <UploadView 
        @pdf-processed="handlePdfProcessed" 
        @start-practicing="handleStartPracticing"
        @open-settings="currentView = 'settings'"
        @reading-uploaded="handleReadingUploaded"
      />
    </div>
    <div v-else-if="currentView === 'reading-modules'" class="view-container">
      <ReadingModuleSelector 
        @module-selected="handleModuleSelected"
        @upload-new="currentView = 'upload'"
        @back="currentView = 'difficulty'"
      />
    </div>
    <div v-else-if="currentView === 'reading' && readingContent" class="view-container">
      <ReadingView 
        :content="readingContent"
        @back="currentView = 'reading-modules'"
      />
    </div>
    <div v-else-if="currentView === 'difficulty'" class="view-container">
      <DifficultySelection 
        @difficulty-selected="handleDifficultySelected"
        @type-selected="handleTypeSelected"
        @upload-new="currentView = 'upload'"
        @reading-mode="handleReadingMode"
      />
    </div>
    <div v-else-if="currentView === 'quiz'" class="view-container">
      <QuizView 
        :words="words" 
        :difficulty="selectedDifficulty"
        :wordType="selectedWordType"
        @quiz-complete="handleQuizComplete"
        @back="currentView = 'difficulty'"
      />
    </div>
    <div v-else-if="currentView === 'results'" class="view-container">
      <ResultsView 
        :score="quizScore" 
        :total="quizTotal"
        @restart="handleRestart"
        @back="currentView = 'difficulty'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UploadView from './components/UploadView.vue'
import DifficultySelection from './components/DifficultySelection.vue'
import QuizView from './components/QuizView.vue'
import ResultsView from './components/ResultsView.vue'
import SettingsView from './components/SettingsView.vue'
import WordManagerView from './components/WordManagerView.vue'
import ReadingView from './components/ReadingView.vue'
import ReadingModuleSelector from './components/ReadingModuleSelector.vue'
import type { Word, Sentence, ReadingContent } from './types'

const currentView = ref<'settings' | 'upload' | 'difficulty' | 'quiz' | 'results' | 'word-manager' | 'reading' | 'reading-modules'>('upload')
const words = ref<Word[]>([])
const sentences = ref<Sentence[]>([])
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | null>(null)
const selectedWordType = ref<'verb' | 'noun' | 'adjective' | null>(null)
const quizScore = ref(0)
const quizTotal = ref(0)
const readingContent = ref<ReadingContent | null>(null)

const handleStartPracticing = (data: { words: Word[] }) => {
  words.value = data.words
  sentences.value = [] // Sentences will be extracted when needed
  currentView.value = 'difficulty'
}

const handlePdfProcessed = (data: { words: Word[], sentences: Sentence[], text: string }) => {
  words.value = data.words
  sentences.value = data.sentences
  // Words are already saved (localStorage + cloud if enabled)
  currentView.value = 'difficulty'
}

const handleDifficultySelected = (difficulty: 'easy' | 'medium' | 'hard') => {
  selectedDifficulty.value = difficulty
  selectedWordType.value = null
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleTypeSelected = (type: 'verb' | 'noun' | 'adjective') => {
  selectedWordType.value = type
  selectedDifficulty.value = null
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleQuizComplete = (score: number, total: number) => {
  quizScore.value = score
  quizTotal.value = total
  currentView.value = 'results'
}

const handleRestart = () => {
  currentView.value = 'difficulty'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleReadingUploaded = () => {
  // After uploading, show module selector
  currentView.value = 'reading-modules'
}

const handleModuleSelected = (module: ReadingContent) => {
  readingContent.value = module
  currentView.value = 'reading'
}

const handleReadingMode = () => {
  // Show module selector
  currentView.value = 'reading-modules'
}
</script>

<style scoped>
.app-container {
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
}

.view-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 10px;
  max-height: 100vh;
  overflow-y: auto;
}
</style>

