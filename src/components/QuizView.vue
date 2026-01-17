<template>
  <div class="quiz-container">
    <div class="quiz-header">
      <button @click="$emit('back')" class="back-btn">← Back</button>
      <div class="progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ totalWords }}</div>
      </div>
      <div class="score">Score: {{ score }}</div>
    </div>

    <div v-if="currentWord" class="quiz-content">
      <FlashCard 
        ref="flashCardRef"
        :word="currentWord"
      />

      <div v-if="!showAnswer" class="options-container">
        <p class="question-text">What does "{{ currentWord.german }}" mean?</p>
        <div class="options">
          <button
            v-for="(option, index) in options"
            :key="index"
            class="option-btn"
            :class="{ 
              'correct': showAnswer && option === currentWord.english,
              'wrong': showAnswer && selectedAnswer === option && option !== currentWord.english
            }"
            @click="selectOption(option)"
            :disabled="showAnswer"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div v-if="showAnswer" class="answer-feedback">
        <div v-if="selectedAnswer === currentWord.english" class="feedback correct-feedback">
          ✓ Correct! +1 point
        </div>
        <div v-else class="feedback wrong-feedback">
          ✗ Wrong! The correct answer is "{{ currentWord.english }}"
        </div>
        <button @click="nextWord" class="next-btn">Next →</button>
      </div>

      <button v-if="!showAnswer" @click="flipCard" class="flip-btn">
        Don't know? Flip card
      </button>
    </div>

    <div v-else class="quiz-complete">
      <p>Loading quiz...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import FlashCard from './FlashCard.vue'
import type { Word, Difficulty } from '../types'

const props = defineProps<{
  words: Word[]
  difficulty: Difficulty
}>()

const emit = defineEmits<{
  (e: 'quiz-complete', score: number, total: number): void
  (e: 'back'): void
}>()

const flashCardRef = ref<InstanceType<typeof FlashCard> | null>(null)
const currentIndex = ref(0)
const score = ref(0)
const selectedAnswer = ref<string | null>(null)
const showAnswer = ref(false)

const wordCounts = {
  easy: 10,
  medium: 20,
  hard: 30
}

const quizWords = computed(() => {
  const count = wordCounts[props.difficulty]
  const shuffled = [...props.words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, props.words.length))
})

const currentWord = computed(() => {
  return quizWords.value[currentIndex.value]
})

const totalWords = computed(() => quizWords.value.length)

const progressPercent = computed(() => {
  return ((currentIndex.value + 1) / totalWords.value) * 100
})

const options = ref<string[]>([])

const generateOptions = () => {
  if (!currentWord.value) return

  const correctAnswer = currentWord.value.english
  const wrongAnswers = quizWords.value
    .filter(w => w.english !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.english)

  options.value = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
}

watch(currentWord, () => {
  if (currentWord.value) {
    generateOptions()
    selectedAnswer.value = null
    showAnswer.value = false
    if (flashCardRef.value) {
      flashCardRef.value.reset()
    }
  }
})

onMounted(() => {
  generateOptions()
})

const selectOption = (option: string) => {
  if (showAnswer.value) return

  selectedAnswer.value = option
  showAnswer.value = true

  if (option === currentWord.value.english) {
    score.value++
  }

  // Auto-flip card after selection
  setTimeout(() => {
    if (flashCardRef.value) {
      flashCardRef.value.flip()
    }
  }, 300)
}

const flipCard = () => {
  if (flashCardRef.value) {
    flashCardRef.value.flip()
  }
  showAnswer.value = true
}

const nextWord = () => {
  if (currentIndex.value < totalWords.value - 1) {
    currentIndex.value++
  } else {
    // Quiz complete
    emit('quiz-complete', score.value, totalWords.value)
  }
}
</script>

<style scoped>
.quiz-container {
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.quiz-header {
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
  margin-bottom: 10px;
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

.score {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-top: 10px;
}

.quiz-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.options-container {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  background: #f5f5f5;
  color: #333;
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 16px;
  text-align: left;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.option-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.option-btn.correct {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.option-btn.wrong {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.option-btn:disabled {
  opacity: 0.7;
}

.answer-feedback {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.feedback {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 10px;
}

.correct-feedback {
  background: #e8f5e9;
  color: #2e7d32;
}

.wrong-feedback {
  background: #ffebee;
  color: #c62828;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  width: 100%;
}

.flip-btn {
  background: white;
  color: #667eea;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #667eea;
}

.quiz-complete {
  text-align: center;
  color: white;
  font-size: 18px;
}
</style>

