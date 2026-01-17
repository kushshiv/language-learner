<template>
  <div class="app-container">
    <div v-if="currentView === 'upload'" class="view-container">
      <UploadView @pdf-processed="handlePdfProcessed" />
    </div>
    <div v-else-if="currentView === 'difficulty'" class="view-container">
      <DifficultySelection 
        @difficulty-selected="handleDifficultySelected"
        @upload-new="currentView = 'upload'"
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
import type { Word } from './types'
import { loadWords, saveWords } from './utils/storage'

const currentView = ref<'upload' | 'difficulty' | 'quiz' | 'results'>('upload')
const words = ref<Word[]>([])
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy')
const quizScore = ref(0)
const quizTotal = ref(0)

onMounted(() => {
  const savedWords = loadWords()
  if (savedWords && savedWords.length > 0) {
    words.value = savedWords
    currentView.value = 'difficulty'
  }
})

const handlePdfProcessed = (processedWords: Word[]) => {
  words.value = processedWords
  saveWords(processedWords)
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
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}
</style>

