<template>
  <div class="flashcard-container" @click="flipCard">
    <div class="flashcard" :class="{ 'flipped': isFlipped }">
      <div class="flashcard-front">
        <div class="word-type-badge">{{ word.type }}</div>
        <div class="german-word">{{ word.german }}</div>
        <div class="flip-hint">Tap to flip</div>
      </div>
      <div class="flashcard-back">
        <div class="back-content">
          <div class="english-translation">{{ cleanTranslation(word.english) }}</div>
          <div class="example-sentence">{{ word.example }}</div>
          <div class="word-type">{{ word.type }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Word } from '../types'

const props = defineProps<{
  word: Word
}>()

const isFlipped = ref(false)

const cleanTranslation = (text: string) => {
  return text.replace(/^\[|\]$/g, '').trim()
}

const flipCard = () => {
  isFlipped.value = !isFlipped.value
}

defineExpose({
  flip: () => { isFlipped.value = true },
  reset: () => { isFlipped.value = false },
  isFlipped: () => isFlipped.value
})
</script>

<style scoped>
.flashcard-container {
  perspective: 1000px;
  width: 100%;
  max-width: 400px;
  height: 250px;
  margin: 0 auto;
  flex-shrink: 0;
}

.flashcard {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.flashcard-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.flashcard-back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: rotateY(180deg);
}

.word-type-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.3);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.german-word {
  font-size: clamp(24px, 6vw, 42px);
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  max-width: 100%;
  padding: 0 10px;
  overflow-wrap: break-word;
  line-height: 1.2;
}

.flip-hint {
  position: absolute;
  bottom: 20px;
  font-size: 14px;
  opacity: 0.8;
}

.back-content {
  text-align: center;
  width: 100%;
}

.english-translation {
  font-size: clamp(20px, 5vw, 32px);
  font-weight: 700;
  margin-bottom: 20px;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  max-width: 100%;
  padding: 0 10px;
  overflow-wrap: break-word;
  line-height: 1.2;
}

.example-sentence {
  font-size: 16px;
  font-style: italic;
  margin-bottom: 20px;
  opacity: 0.9;
  line-height: 1.4;
}

.word-type {
  font-size: 14px;
  text-transform: uppercase;
  opacity: 0.8;
  font-weight: 600;
}
</style>

