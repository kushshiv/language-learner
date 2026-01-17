<template>
  <div class="difficulty-container">
    <div class="difficulty-card">
      <h1 class="title">Choose Difficulty</h1>
      <p class="subtitle">Select your learning level</p>
      
      <div class="difficulty-options">
        <button 
          class="difficulty-btn easy" 
          @click="selectDifficulty('easy')"
        >
          <div class="difficulty-icon">🌱</div>
          <div class="difficulty-name">Easy</div>
          <div class="difficulty-desc">5-10 words per quiz</div>
        </button>

        <button 
          class="difficulty-btn medium" 
          @click="selectDifficulty('medium')"
        >
          <div class="difficulty-icon">🌿</div>
          <div class="difficulty-name">Medium</div>
          <div class="difficulty-desc">15-20 words per quiz</div>
        </button>

        <button 
          class="difficulty-btn hard" 
          @click="selectDifficulty('hard')"
        >
          <div class="difficulty-icon">🌳</div>
          <div class="difficulty-name">Hard</div>
          <div class="difficulty-desc">25-30 words per quiz</div>
        </button>
      </div>

      <button @click="$emit('upload-new')" class="btn-secondary">
        Upload New PDF
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'difficulty-selected', difficulty: 'easy' | 'medium' | 'hard'): void
  (e: 'upload-new'): void
}>()

const selectDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
  emit('difficulty-selected', difficulty)
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

