<template>
  <div class="app-container">
    <div v-if="currentView === 'settings'" class="view-container">
      <SettingsView @back="currentView = 'upload'" />
    </div>
    <div v-else-if="currentView === 'upload'" class="view-container">
      <UploadView 
        @pdf-processed="handlePdfProcessed" 
        @start-practicing="handleStartPracticing"
        @open-settings="currentView = 'settings'"
      />
    </div>
    <div v-else-if="currentView === 'difficulty'" class="view-container">
      <DifficultySelection 
        @difficulty-selected="handleDifficultySelected"
        @upload-new="currentView = 'upload'"
        @reading-mode="currentView = 'reading'"
      />
    </div>
    <div v-else-if="currentView === 'reading'" class="view-container">
      <ReadingView 
        :sentences="sentences"
        :words="words"
        @back="currentView = 'difficulty'"
      />
    </div>
    <div v-else-if="currentView === 'quiz'" class="view-container">
      <QuizView 
        :words="words" 
        :difficulty="selectedDifficulty"
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
import { ref, onMounted } from 'vue'
import UploadView from './components/UploadView.vue'
import DifficultySelection from './components/DifficultySelection.vue'
import QuizView from './components/QuizView.vue'
import ResultsView from './components/ResultsView.vue'
import ReadingView from './components/ReadingView.vue'
import SettingsView from './components/SettingsView.vue'
import type { Word, Sentence } from './types'

const currentView = ref<'settings' | 'upload' | 'difficulty' | 'quiz' | 'results' | 'reading'>('upload')
const words = ref<Word[]>([])
const sentences = ref<Sentence[]>([])
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy')
const quizScore = ref(0)
const quizTotal = ref(0)

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

