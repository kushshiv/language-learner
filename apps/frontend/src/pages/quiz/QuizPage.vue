<template>
  <div class="quiz-container">
    <div class="quiz-header">
      <button @click="$emit('back')" class="back-btn">← Back</button>
      <div class="quiz-mode-info" v-if="props.wordType || props.practiceAll || props.repeatedPractice">
        <span class="mode-badge" v-if="props.wordType">{{ getTypeLabel(props.wordType) }}</span>
        <span class="mode-badge" v-else-if="props.repeatedPractice">🔄 Repeated Practice - Chunk {{ props.chunkNumber }}</span>
        <span class="mode-badge" v-else-if="props.practiceAll">
          Practice All - Chunk {{ props.chunkNumber }}
        </span>
      </div>
      <div class="progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ totalWords }}</div>
      </div>
      <div class="score">Score: {{ score }}</div>
      <div class="streak-progress">
        <div class="streak-label">Daily Streak: {{ streakProgress.currentCount }} / {{ streakProgress.goal }}</div>
        <div class="streak-bar">
          <div 
            class="streak-fill" 
            :style="{ width: Math.min(100, (streakProgress.currentCount / streakProgress.goal) * 100) + '%' }"
            :class="{ completed: streakProgress.completed }"
          ></div>
        </div>
      </div>
    </div>

    <div v-if="currentWord" class="quiz-content">
      <div class="flashcard-wrapper" @click.stop>
        <FlashCard 
          ref="flashCardRef"
          :word="currentWord"
          :disabled="showAnswer"
        />
      </div>

      <div v-if="!showAnswer" class="options-container">
        <p class="question-text">What does "{{ currentWord.german }}" mean?</p>
        <div class="options">
          <button
            v-for="(option, index) in options"
            :key="index"
            class="option-btn"
            :class="{ 
              'correct': showAnswer && option.replace(/^\[|\]$/g, '').trim() === currentWord.english.replace(/^\[|\]$/g, '').trim(),
              'wrong': showAnswer && selectedAnswer === option && option.replace(/^\[|\]$/g, '').trim() !== currentWord.english.replace(/^\[|\]$/g, '').trim()
            }"
            @click="selectOption(option)"
            :disabled="showAnswer"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div v-if="showAnswer" class="answer-feedback">
        <div v-if="selectedAnswer && selectedAnswer.replace(/^\[|\]$/g, '').trim() === currentWord.english.replace(/^\[|\]$/g, '').trim()" class="feedback correct-feedback">
          ✓ Correct! +1 point
        </div>
        <div v-else class="feedback wrong-feedback">
          ✗ Wrong! The correct answer is "{{ currentWord.english.replace(/^\[|\]$/g, '') }}"
        </div>
        
        <!-- Translation Update Section (shown when marked as doubt) -->
        <div v-if="showTranslationUpdate" class="translation-update-section">
          <div class="translation-header">
            <span class="translation-label">New Translation:</span>
            <button 
              v-if="translating"
              class="loading-btn"
              disabled
            >
              <span class="spinner-small"></span> Translating...
            </button>
          </div>
          <div v-if="newTranslation" class="new-translation">
            <div class="translation-text">{{ newTranslation }}</div>
            <div class="translation-comparison">
              <span class="old-translation">Current: {{ currentWord.english }}</span>
              <span class="arrow">→</span>
              <span class="new-translation-text">New: {{ newTranslation }}</span>
            </div>
            <button 
              @click.stop="updateTranslation"
              class="update-translation-btn"
              :disabled="updating"
            >
              {{ updating ? 'Updating...' : '✓ Update Translation' }}
            </button>
          </div>
          <div v-else-if="translationError" class="translation-error">
            Failed to translate. Please try again.
          </div>
        </div>
        
        <div class="action-buttons-container" @click.stop.prevent>
          <button 
            @click.stop.prevent="handleMarkDoubt" 
            class="mark-doubt-btn"
            :class="{ 'marked': currentWord.needsReview }"
            :disabled="translating || updating"
          >
            <span v-if="currentWord.needsReview">✓ Marked for Review</span>
            <span v-else>⚠️ Mark as Doubt</span>
          </button>
          <button 
            @click.stop.prevent="deleteCurrentWord" 
            class="delete-word-btn"
            :disabled="deleting || translating || updating"
          >
            🗑️ Delete Word
          </button>
        </div>
        <button @click="nextWord" class="next-btn" :disabled="deleting || translating || updating">Next →</button>
      </div>

      <button v-if="!showAnswer" @click="flipCard" class="flip-btn">
        Don't know? Flip card
      </button>
    </div>

    <div v-else class="quiz-complete">
      <p>Loading quiz...</p>
    </div>

    <!-- Streak Completion Notification -->
    <div v-if="showStreakNotification" class="streak-notification">
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">
          <div class="notification-title">Streak Completed!</div>
          <div class="notification-message">Congratulations! You've completed your daily goal of {{ streakProgress.goal }} unique words!</div>
        </div>
        <button @click="showStreakNotification = false" class="notification-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import FlashCard from '../../features/quiz/components/FlashCard.vue'
import { markWordForReview, deleteWords, updateWordTranslation } from '../../features/words/lib/wordStorage'
import { translateWord } from '../../shared/api/translationClient'
import { trackWordPracticed, getTodayProgress } from '../../features/streak/lib/streakStorage'
import { showNotification } from '../../features/streak/lib/notifications'
import { getRepeatedPracticeList, replaceWordInRepeatedPractice, getRepeatedPracticeChunk } from '../../features/practice/lib/repeatedPracticeStorage'
import type { Word, Difficulty } from '../../shared/types'

const props = defineProps<{
  words: Word[]
  difficulty: Difficulty | null
  // Allow any word type label
  wordType: string | null
  practiceAll?: boolean
  chunkNumber?: number | null
  repeatedPractice?: boolean
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
const markedWords = ref<Set<string>>(new Set()) // Track locally marked words
const deleting = ref(false)
const quizWordsList = ref<Word[]>([]) // Local copy of quiz words that can be modified
const translating = ref(false)
const updating = ref(false)
const newTranslation = ref<string | null>(null)
const translationError = ref(false)
const showTranslationUpdate = ref(false)
const streakCompleted = ref(false)
const streakProgress = ref({ currentCount: 0, goal: 30, completed: false })
const showStreakNotification = ref(false)
const flipTimeout = ref<NodeJS.Timeout | null>(null)

const wordCounts = {
  easy: 10,
  medium: 20,
  hard: 30
}

const quizWords = computed(() => {
  // Use local list if available, otherwise compute from props
  if (quizWordsList.value.length > 0) {
    return quizWordsList.value
  }
  
  let filteredWords = [...props.words]
  
  // Filter by word type if specified
  if (props.wordType) {
    filteredWords = filteredWords.filter(word => word.type === props.wordType)
  }
  
  // If repeated practice, use the stored list (deterministic, sorted by name)
  if (props.repeatedPractice) {
    // This will be initialized in onMounted, but return empty for now
    return []
  }

  // If practice all with chunk, use only that chunk
  if (props.practiceAll && props.chunkNumber) {
    const CHUNK_SIZE = 100
    const startIndex = (props.chunkNumber - 1) * CHUNK_SIZE
    const endIndex = Math.min(startIndex + CHUNK_SIZE, filteredWords.length)
    const chunkWords = filteredWords.slice(startIndex, endIndex)
    return chunkWords.sort(() => Math.random() - 0.5)
  }
  
  // If practice all without chunk (legacy), use all words
  if (props.practiceAll) {
    // Shuffle all words
    return filteredWords.sort(() => Math.random() - 0.5)
  }
  
  // Determine word count
  let count: number
  if (props.difficulty) {
    count = wordCounts[props.difficulty]
  } else if (props.wordType) {
    // Default to 20 words for type-based quizzes
    count = 20
  } else {
    count = 10 // Fallback
  }
  
  // Shuffle and limit
  const shuffled = filteredWords.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, filteredWords.length))
})

const currentWord = computed(() => {
  const word = quizWords.value[currentIndex.value]
  if (!word) return null
  // Check if word is marked locally or in storage
  const isMarked = markedWords.value.has(word.german.toLowerCase().trim()) || word.needsReview === true
  return { ...word, needsReview: isMarked }
})

const totalWords = computed(() => quizWords.value.length)

const progressPercent = computed(() => {
  return ((currentIndex.value + 1) / totalWords.value) * 100
})

const options = ref<string[]>([])

const generateOptions = () => {
  if (!currentWord.value) return

  // Clean up any brackets that might be in translations
  const cleanTranslation = (text: string) => text.replace(/^\[|\]$/g, '').trim()
  
  const correctAnswer = cleanTranslation(currentWord.value.english)
  const wrongAnswers = quizWords.value
    .filter(w => cleanTranslation(w.english) !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => cleanTranslation(w.english))

  options.value = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
}

watch(currentWord, (newWord, oldWord) => {
  if (currentWord.value && newWord) {
    // Only reset if we're moving to a different word (different German text)
    // Don't reset if we're just updating properties of the same word
    const isNewWord = !oldWord || oldWord.german !== newWord.german
    
    if (isNewWord) {
      // Cancel any pending flip operations
      if (flipTimeout.value) {
        clearTimeout(flipTimeout.value)
        flipTimeout.value = null
      }
      
      generateOptions()
      selectedAnswer.value = null
      showAnswer.value = false
      // Reset translation section when moving to next word
      showTranslationUpdate.value = false
      newTranslation.value = null
      translationError.value = false
      streakCompleted.value = false // Reset streak completion flag for new word
      
      // Reset flashcard to unflipped state
      if (flashCardRef.value) {
        flashCardRef.value.reset()
      }
    }
  }
})

onMounted(async () => {
  // Initialize quiz words list
  await initializeQuizWords()
  generateOptions()
  // Initialize marked words from props
  props.words.forEach(word => {
    if (word.needsReview) {
      markedWords.value.add(word.german.toLowerCase().trim())
    }
  })
  // Load today's streak progress
  await updateStreakProgress()
  
  // Check if streak was already completed today (to set the flag)
  const today = new Date().toISOString().split('T')[0]
  const notificationKey = `streak-completed-${today}`
  if (localStorage.getItem(notificationKey) && streakProgress.value.completed) {
    streakCompleted.value = true
  }
})

const updateStreakProgress = async () => {
  streakProgress.value = await getTodayProgress()
}

const checkStreakCompletion = async (germanWord: string) => {
  const result = await trackWordPracticed(germanWord)
  
  // Only update if it's a new word
  if (result.isNew) {
    streakProgress.value = {
      currentCount: result.currentCount,
      goal: result.goal,
      completed: result.completed
    }
    
    // If just completed the streak, show notification (only once per day)
    if (result.completed) {
      const today = new Date().toISOString().split('T')[0]
      const notificationKey = `streak-completed-${today}`
      const alreadyNotified = localStorage.getItem(notificationKey)
      
      if (!alreadyNotified) {
        // Mark as notified for today
        localStorage.setItem(notificationKey, 'true')
        streakCompleted.value = true
        showStreakNotification.value = true
        await showNotification('🎉 Streak Completed!', `Congratulations! You've completed your daily goal of ${result.goal} unique words!`)
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          showStreakNotification.value = false
        }, 5000)
      }
    }
  }
}

const initializeQuizWords = async () => {
  // If repeated practice, load from chunk storage (deterministic, sorted by name)
  if (props.repeatedPractice && props.chunkNumber) {
    const repeatedWords = await getRepeatedPracticeChunk(props.chunkNumber)
    // Keep them sorted by name for consistency (no shuffling)
    quizWordsList.value = repeatedWords.sort((a, b) => a.german.toLowerCase().localeCompare(b.german.toLowerCase()))
    return
  }

  let filteredWords = [...props.words]
  
  // Filter by word type if specified
  if (props.wordType) {
    filteredWords = filteredWords.filter(word => word.type === props.wordType)
  }
  
  // If practice all with chunk, use only that chunk
  if (props.practiceAll && props.chunkNumber) {
    const CHUNK_SIZE = 100
    const startIndex = (props.chunkNumber - 1) * CHUNK_SIZE
    const endIndex = Math.min(startIndex + CHUNK_SIZE, filteredWords.length)
    
    // Get words for this chunk (deterministic - same words always in same chunk)
    const chunkWords = filteredWords.slice(startIndex, endIndex)
    
    // Shuffle within the chunk for variety, but same words stay in same chunk
    quizWordsList.value = chunkWords.sort(() => Math.random() - 0.5)
    return
  }
  
  // If practice all without chunk (legacy), use all words
  if (props.practiceAll) {
    // Shuffle all words
    quizWordsList.value = filteredWords.sort(() => Math.random() - 0.5)
    return
  }
  
  // Determine word count
  let count: number
  if (props.difficulty) {
    count = wordCounts[props.difficulty]
  } else if (props.wordType) {
    // Default to 20 words for type-based quizzes
    count = 20
  } else {
    count = 10 // Fallback
  }
  
  // Shuffle and limit
  const shuffled = filteredWords.sort(() => Math.random() - 0.5)
  quizWordsList.value = shuffled.slice(0, Math.min(count, filteredWords.length))
}

const selectOption = async (option: string) => {
  if (showAnswer.value || !currentWord.value) return

  selectedAnswer.value = option
  showAnswer.value = true

  // Clean both for comparison (remove brackets if any)
  const cleanOption = option.replace(/^\[|\]$/g, '').trim()
  const cleanCorrect = currentWord.value.english.replace(/^\[|\]$/g, '').trim()
  
  if (cleanOption === cleanCorrect) {
    score.value++
  }

  // Track word for streak
  await checkStreakCompletion(currentWord.value.german)

  // Auto-flip card after selection (only if still on the same word)
  if (flipTimeout.value) {
    clearTimeout(flipTimeout.value)
  }
  const currentWordAtSelection = currentWord.value
  flipTimeout.value = setTimeout(() => {
    // Only flip if we're still showing the answer for this word and it's the same word
    if (showAnswer.value && flashCardRef.value && currentWord.value && 
        currentWord.value.german === currentWordAtSelection?.german) {
      flashCardRef.value.flip()
    }
    flipTimeout.value = null
  }, 300)
}

const flipCard = async () => {
  if (flashCardRef.value) {
    flashCardRef.value.flip()
  }
  showAnswer.value = true
  
  // Track word for streak when flipping
  if (currentWord.value) {
    await checkStreakCompletion(currentWord.value.german)
  }
}

const nextWord = () => {
  if (currentIndex.value < totalWords.value - 1) {
    currentIndex.value++
  } else {
    // If practicing a chunk or repeated practice, loop back to the beginning instead of completing
    if ((props.practiceAll && props.chunkNumber) || props.repeatedPractice) {
      currentIndex.value = 0
      // Reset score for the new loop (optional - you might want to keep cumulative score)
      // score.value = 0
    } else {
      // Quiz complete
      emit('quiz-complete', score.value, totalWords.value)
    }
  }
}

const getTypeLabel = (type: string): string => {
  const labels = {
    verb: 'Verbs',
    noun: 'Nouns',
    adjective: 'Adjectives'
  }
  const key = type.toLowerCase()
  if (key in labels) {
    // @ts-expect-error – we know key is one of the above if present
    return labels[key]
  }
  // Fallback: capitalise arbitrary type labels
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const handleMarkDoubt = async (event: Event) => {
  event.stopPropagation()
  event.preventDefault()
  event.stopImmediatePropagation()
  
  await toggleMarkDoubt()
}

const toggleMarkDoubt = async () => {
  if (!currentWord.value) return
  
  const wordKey = currentWord.value.german.toLowerCase().trim()
  const newNeedsReview = !currentWord.value.needsReview
  
  try {
    // Update in storage (this will sync to Gist if enabled)
    await markWordForReview(currentWord.value.german, newNeedsReview)
    
    // Update local tracking
    if (newNeedsReview) {
      markedWords.value.add(wordKey)
      // Trigger translation when marking as doubt
      await fetchNewTranslation()
    } else {
      markedWords.value.delete(wordKey)
      // Hide translation section when unmarking
      showTranslationUpdate.value = false
      newTranslation.value = null
      translationError.value = false
    }
  } catch (error) {
    console.error('Failed to mark word for review:', error)
  }
}

const fetchNewTranslation = async () => {
  if (!currentWord.value) return
  
  translating.value = true
  translationError.value = false
  newTranslation.value = null
  showTranslationUpdate.value = true
  
  try {
    const translation = await translateWord(currentWord.value.german)
    if (translation) {
      newTranslation.value = translation
    } else {
      translationError.value = true
    }
  } catch (error) {
    console.error('Translation failed:', error)
    translationError.value = true
  } finally {
    translating.value = false
  }
}

const updateTranslation = async () => {
  if (!currentWord.value || !newTranslation.value) return
  
  updating.value = true
  
  try {
    // Update translation in storage (this will sync to Gist if enabled)
    await updateWordTranslation(currentWord.value.german, newTranslation.value)
    
    // Update local quiz words list
    const wordIndex = quizWordsList.value.findIndex(
      w => w.german.toLowerCase().trim() === currentWord.value!.german.toLowerCase().trim()
    )
    if (wordIndex !== -1) {
      quizWordsList.value[wordIndex].english = newTranslation.value
    }
    
    // Note: currentWord is a computed property, so updating quizWordsList will automatically update it
    
    // Hide translation section after update
    showTranslationUpdate.value = false
    newTranslation.value = null
    
    // Show success message briefly
    setTimeout(() => {
      // Translation updated successfully
    }, 100)
  } catch (error) {
    console.error('Failed to update translation:', error)
    alert('Failed to update translation. Please try again.')
  } finally {
    updating.value = false
  }
}

const deleteCurrentWord = async () => {
  if (!currentWord.value) return
  
  const wordToDelete = currentWord.value.german
  if (!confirm(`Delete "${wordToDelete}"? This word will be removed from your collection.`)) {
    return
  }
  
  deleting.value = true
  
  try {
    // Delete from storage (this will sync to Gist if enabled)
    await deleteWords([wordToDelete])
    
    // Remove from local quiz words list
    const wordIndex = quizWordsList.value.findIndex(
      w => w.german.toLowerCase().trim() === wordToDelete.toLowerCase().trim()
    )
    if (wordIndex !== -1) {
      quizWordsList.value.splice(wordIndex, 1)
    }
    
    // Remove from marked words if it was marked
    markedWords.value.delete(wordToDelete.toLowerCase().trim())
    
    // If in repeated practice mode, try to add a replacement word
    if (props.repeatedPractice) {
      const replacement = await replaceWordInRepeatedPractice(wordToDelete)
      if (replacement) {
        // Add replacement word, keeping sorted order
        quizWordsList.value.push(replacement)
        quizWordsList.value.sort((a, b) => a.german.toLowerCase().localeCompare(b.german.toLowerCase()))
      }
    }

    // If we deleted the current word, move to next or end quiz
    if (currentIndex.value >= quizWordsList.value.length) {
      // Quiz complete (no more words)
      emit('quiz-complete', score.value, totalWords.value)
    } else {
      // Move to next word (index stays the same since we removed one)
      generateOptions()
      selectedAnswer.value = null
      showAnswer.value = false
      if (flashCardRef.value) {
        flashCardRef.value.reset()
      }
    }
  } catch (error) {
    console.error('Failed to delete word:', error)
    alert('Failed to delete word. Please try again.')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.quiz-container {
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  padding: 10px;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  overflow-y: auto;
}

.quiz-header {
  background: white;
  border-radius: 15px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.back-btn {
  background: none;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
  padding: 5px 0;
  margin-bottom: 10px;
}

.quiz-mode-info {
  text-align: center;
  margin-bottom: 10px;
}

.mode-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-top: 8px;
}

.quiz-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
}

.flashcard-wrapper {
  flex-shrink: 0;
}

.options-container {
  background: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.question-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
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
  padding: 12px 15px;
  border-radius: 10px;
  font-size: 15px;
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
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  flex-shrink: 0;
}

.feedback {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding: 12px;
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
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
}

.flip-btn {
  background: white;
  color: #667eea;
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #667eea;
  flex-shrink: 0;
}

.action-buttons-container {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.mark-doubt-btn {
  background: #fff3cd;
  color: #856404;
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #ffc107;
  flex: 1;
  transition: all 0.3s ease;
  cursor: pointer;
}

.mark-doubt-btn:hover {
  background: #ffe082;
  transform: scale(1.02);
}

.mark-doubt-btn.marked {
  background: #d4edda;
  color: #155724;
  border-color: #28a745;
}

.mark-doubt-btn.marked:hover {
  background: #c3e6cb;
}

.delete-word-btn {
  background: #fee;
  color: #c33;
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #fcc;
  flex: 1;
  transition: all 0.3s ease;
  cursor: pointer;
}

.delete-word-btn:hover:not(:disabled) {
  background: #fcc;
  transform: scale(1.02);
}

.delete-word-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.translation-update-section {
  background: #f8f9ff;
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 15px;
  margin: 12px 0;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.translation-label {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.loading-btn {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid #e3f2fd;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.new-translation {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.translation-text {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #4caf50;
}

.translation-comparison {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  padding: 8px;
  background: white;
  border-radius: 8px;
}

.old-translation {
  color: #999;
  text-decoration: line-through;
}

.arrow {
  color: #667eea;
  font-weight: 700;
}

.new-translation-text {
  color: #4caf50;
  font-weight: 600;
}

.update-translation-btn {
  background: #4caf50;
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.update-translation-btn:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.02);
}

.update-translation-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.translation-error {
  color: #c33;
  font-size: 14px;
  padding: 10px;
  background: #fee;
  border-radius: 8px;
  text-align: center;
}

.quiz-complete {
  text-align: center;
  color: white;
  font-size: 18px;
}

.streak-progress {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9ff;
  border-radius: 8px;
}

.streak-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  text-align: center;
  font-weight: 600;
}

.streak-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.streak-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.streak-fill.completed {
  background: linear-gradient(90deg, #4caf50, #45a049);
  animation: pulse 1s ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.streak-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.4);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 350px;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.notification-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
}

.notification-message {
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.4;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

