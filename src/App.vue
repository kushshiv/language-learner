<template>
  <div class="app-container">
    <div v-if="currentView === 'upload'" class="view-container">
      <UploadView @pdf-processed="handlePdfProcessed" />
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
import type { Word, Sentence } from './types'
import { loadWords, saveWords, loadSentences, loadPdfText, saveSentences } from './utils/storage'
import { extractSentences } from './utils/sentenceExtractor'

const currentView = ref<'upload' | 'difficulty' | 'quiz' | 'results' | 'reading'>('upload')
const words = ref<Word[]>([])
const sentences = ref<Sentence[]>([])
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy')
const quizScore = ref(0)
const quizTotal = ref(0)

onMounted(async () => {
  const savedWords = loadWords()
  const savedSentences = loadSentences()
  if (savedWords && savedWords.length > 0) {
    words.value = savedWords
    if (savedSentences && savedSentences.length > 0) {
      sentences.value = savedSentences
    } else {
      // Try to extract sentences from saved PDF text
      const savedText = loadPdfText()
      if (savedText) {
        const wordDict = new Map<string, Word>()
        savedWords.forEach(word => {
          wordDict.set(word.german.toLowerCase(), word)
        })
        try {
          const extractedSentences = await extractSentences(savedText, wordDict)
          if (extractedSentences.length > 0) {
            sentences.value = extractedSentences
            saveSentences(extractedSentences)
          }
        } catch (error) {
          console.error('Failed to extract sentences:', error)
        }
      }
    }
    currentView.value = 'difficulty'
  }
})

const handlePdfProcessed = (data: { words: Word[], sentences: Sentence[], text: string }) => {
  words.value = data.words
  sentences.value = data.sentences
  saveWords(data.words)
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

