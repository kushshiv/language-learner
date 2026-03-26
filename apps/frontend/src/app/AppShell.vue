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
      />
    </div>
    <div v-else-if="currentView === 'difficulty'" class="view-container">
      <DifficultySelection 
        @difficulty-selected="handleDifficultySelected"
        @type-selected="handleTypeSelected"
        @practice-all="handlePracticeAll"
        @repeated-practice-selected="handleRepeatedPracticeSelected"
        @upload-new="currentView = 'upload'"
      />
    </div>
    <div v-else-if="currentView === 'quiz'" class="view-container">
      <QuizView 
        :words="words" 
        :difficulty="selectedDifficulty"
        :wordType="selectedWordType"
        :practiceAll="practiceAll"
        :chunkNumber="selectedChunkNumber"
        :repeatedPractice="repeatedPractice"
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
import UploadView from '../pages/upload/UploadPage.vue'
import DifficultySelection from '../pages/practice-setup/PracticeSetupPage.vue'
import QuizView from '../pages/quiz/QuizPage.vue'
import ResultsView from '../pages/results/ResultsPage.vue'
import SettingsView from '../pages/settings/SettingsPage.vue'
import WordManagerView from '../pages/word-manager/WordManagerPage.vue'
import { scheduleStreakNotifications, areNotificationsEnabled } from '../features/streak/lib/notifications'
import type { Word, Sentence } from '../shared/types'

const currentView = ref<'settings' | 'upload' | 'difficulty' | 'quiz' | 'results' | 'word-manager'>('upload')
const words = ref<Word[]>([])
const sentences = ref<Sentence[]>([])
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | null>(null)
// Allow any word type label (e.g., verb, noun, adjective, preposition, etc.)
const selectedWordType = ref<string | null>(null)
const practiceAll = ref(false)
const selectedChunkNumber = ref<number | null>(null)
const repeatedPractice = ref(false)
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
  selectedWordType.value = null
  practiceAll.value = false
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleTypeSelected = (type: string) => {
  selectedWordType.value = type
  selectedDifficulty.value = null
  practiceAll.value = false
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handlePracticeAll = (chunkNumber: number) => {
  selectedDifficulty.value = null
  selectedWordType.value = null
  practiceAll.value = true
  repeatedPractice.value = false
  selectedChunkNumber.value = chunkNumber
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleRepeatedPracticeSelected = (chunkNumber: number) => {
  selectedDifficulty.value = null
  selectedWordType.value = null
  practiceAll.value = false
  repeatedPractice.value = true
  selectedChunkNumber.value = chunkNumber
  currentView.value = 'quiz'
  quizScore.value = 0
  quizTotal.value = 0
}

const handleQuizComplete = (score: number, total: number) => {
  quizScore.value = score
  quizTotal.value = total
  currentView.value = 'results'
}

onMounted(async () => {
  // Initialize notifications if enabled
  if (areNotificationsEnabled()) {
    await scheduleStreakNotifications()
  }
})

const handleRestart = () => {
  currentView.value = 'difficulty'
  quizScore.value = 0
  quizTotal.value = 0
  practiceAll.value = false
  repeatedPractice.value = false
  selectedChunkNumber.value = null
  selectedDifficulty.value = null
  selectedWordType.value = null
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

