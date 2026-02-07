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
        <div class="type-options">
          <button 
            class="type-btn verb" 
            @click="selectType('verb')"
          >
            <div class="type-icon">🔤</div>
            <div class="type-name">Verbs</div>
            <div class="type-desc">Practice German verbs</div>
          </button>

          <button 
            class="type-btn noun" 
            @click="selectType('noun')"
          >
            <div class="type-icon">📚</div>
            <div class="type-name">Nouns</div>
            <div class="type-desc">Practice German nouns</div>
          </button>

          <button 
            class="type-btn adjective" 
            @click="selectType('adjective')"
          >
            <div class="type-icon">✨</div>
            <div class="type-name">Adjectives</div>
            <div class="type-desc">Practice German adjectives</div>
          </button>
        </div>
      </div>

      <button @click="$emit('upload-new')" class="btn-secondary">
        Upload New PDF
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'difficulty-selected', difficulty: 'easy' | 'medium' | 'hard'): void
  (e: 'type-selected', type: 'verb' | 'noun' | 'adjective'): void
  (e: 'upload-new'): void
}>()

const quizMode = ref<'difficulty' | 'type'>('difficulty')

const selectDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
  emit('difficulty-selected', difficulty)
}

const selectType = (type: 'verb' | 'noun' | 'adjective') => {
  emit('type-selected', type)
}
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
</style>

