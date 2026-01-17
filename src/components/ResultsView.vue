<template>
  <div class="results-container">
    <div class="results-card">
      <div class="results-icon">🎉</div>
      <h1 class="results-title">Quiz Complete!</h1>
      
      <div class="score-display">
        <div class="score-circle">
          <div class="score-number">{{ score }}</div>
          <div class="score-total">/ {{ total }}</div>
        </div>
        <div class="score-percentage">
          {{ percentage }}%
        </div>
      </div>

      <div class="results-message">
        <p v-if="percentage >= 80" class="message excellent">
          Excellent work! You're mastering German! 🌟
        </p>
        <p v-else-if="percentage >= 60" class="message good">
          Great job! Keep practicing! 💪
        </p>
        <p v-else class="message keep-going">
          Good effort! Practice makes perfect! 📚
        </p>
      </div>

      <div class="results-actions">
        <button @click="$emit('restart')" class="btn-primary">
          Try Again
        </button>
        <button @click="$emit('back')" class="btn-secondary">
          Change Difficulty
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  total: number
}>()

const emit = defineEmits<{
  (e: 'restart'): void
  (e: 'back'): void
}>()

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.score / props.total) * 100)
})
</script>

<style scoped>
.results-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.results-card {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.results-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.results-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
}

.score-display {
  margin-bottom: 30px;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 0 auto 15px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.score-total {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
}

.score-percentage {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
}

.results-message {
  margin-bottom: 30px;
}

.message {
  font-size: 18px;
  padding: 15px;
  border-radius: 10px;
  line-height: 1.5;
}

.message.excellent {
  background: #e8f5e9;
  color: #2e7d32;
}

.message.good {
  background: #fff3e0;
  color: #e65100;
}

.message.keep-going {
  background: #e3f2fd;
  color: #1565c0;
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  width: 100%;
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

