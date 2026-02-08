<template>
  <div class="word-manager-container">
    <div class="word-manager-card">
      <div class="header-row">
        <h1 class="title">📝 Manage Words</h1>
        <button @click="$emit('back')" class="back-btn">← Back</button>
      </div>

      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">Total Words:</span>
          <span class="stat-value">{{ allWords.length }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Showing:</span>
          <span class="stat-value">{{ filteredWords.length }}</span>
        </div>
        <div v-if="cloudEnabled" class="stat cloud-stat">
          <span class="stat-label">☁️ Cloud Sync:</span>
          <span class="stat-value">Enabled</span>
        </div>
        <div v-if="allWords.length > 0" class="stat">
          <button
            @click="deleteAllWords"
            class="delete-all-btn"
            :disabled="deleting"
            title="Delete all words"
          >
            🗑️ Delete All
          </button>
        </div>
      </div>

      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by German word or English translation..."
          class="search-input"
        />
        <div class="filter-buttons">
          <button
            v-for="type in (['all', 'noun', 'verb', 'adjective'] as const)"
            :key="type"
            class="filter-btn"
            :class="{ active: selectedType === type }"
            @click="selectedType = type"
          >
            {{ type === 'all' ? 'All' : type }}
          </button>
          <button
            class="filter-btn review-filter"
            :class="{ active: showReviewOnly }"
            @click="showReviewOnly = !showReviewOnly"
          >
            ⚠️ Review ({{ wordsNeedingReview.length }})
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading words...</p>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="filteredWords.length === 0" class="empty-state">
        <p v-if="searchQuery || selectedType !== 'all'">
          No words found matching your search.
        </p>
        <p v-else>
          No words found. Upload a PDF, paste text, or upload a dictionary file to get started.
        </p>
      </div>

      <div v-else class="words-list">
        <div
          v-for="word in filteredWords"
          :key="word.german"
          class="word-card"
        >
          <div class="word-header">
            <div class="word-main">
              <span class="word-german">{{ word.german }}</span>
              <span v-if="word.article" class="word-article">({{ word.article }})</span>
              <span class="word-type-badge" :class="word.type">{{ word.type }}</span>
              <span v-if="word.needsReview" class="review-badge">⚠️ Needs Review</span>
            </div>
            <button
              @click="deleteWord(word.german)"
              class="delete-btn"
              :disabled="deleting"
              title="Delete word"
            >
              🗑️
            </button>
          </div>
          
          <div class="word-details">
            <div class="word-translation">
              <strong>English:</strong> {{ word.english }}
            </div>
            <div v-if="word.example" class="word-example">
              <strong>Example:</strong> {{ word.example }}
            </div>
            <div v-if="word.context" class="word-context">
              <strong>Context:</strong> {{ word.context }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="deleting" class="processing">
        <div class="spinner"></div>
        <p>Deleting word...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAllWords, deleteWords, isCloudSyncEnabled } from '../utils/wordStorage'
import type { Word } from '../types'

const emit = defineEmits<{
  (e: 'back'): void
}>()

const allWords = ref<Word[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const selectedType = ref<'all' | 'noun' | 'verb' | 'adjective'>('all')
const showReviewOnly = ref(false)
const deleting = ref(false)
const cloudEnabled = ref(false)

onMounted(async () => {
  await loadWords()
  cloudEnabled.value = await isCloudSyncEnabled()
})

const loadWords = async () => {
  loading.value = true
  error.value = ''
  try {
    allWords.value = await getAllWords()
  } catch (err) {
    error.value = 'Failed to load words. Please try again.'
    console.error('Error loading words:', err)
  } finally {
    loading.value = false
  }
}

const wordsNeedingReview = computed(() => {
  return allWords.value.filter(word => word.needsReview === true)
})

const filteredWords = computed(() => {
  let filtered = allWords.value

  // Filter by review status
  if (showReviewOnly.value) {
    filtered = filtered.filter(w => w.needsReview === true)
  }

  // Filter by type
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(w => w.type === selectedType.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(w => 
      w.german.toLowerCase().includes(query) ||
      w.english.toLowerCase().includes(query) ||
      (w.example && w.example.toLowerCase().includes(query)) ||
      (w.context && w.context.toLowerCase().includes(query))
    )
  }

  // Sort alphabetically by German word
  return filtered.sort((a, b) => a.german.localeCompare(b.german))
})

const deleteWord = async (germanWord: string) => {
  if (!confirm(`Delete "${germanWord}"? This action cannot be undone.`)) {
    return
  }

  deleting.value = true
  error.value = ''

  try {
    const remainingWords = await deleteWords([germanWord])
    allWords.value = remainingWords
  } catch (err) {
    error.value = 'Failed to delete word. Please try again.'
    console.error('Error deleting word:', err)
  } finally {
    deleting.value = false
  }
}

const deleteAllWords = async () => {
  const wordCount = allWords.value.length
  const confirmMessage = cloudEnabled.value
    ? `Delete ALL ${wordCount} words from both local storage and cloud (Gist)?\n\nThis action cannot be undone!`
    : `Delete ALL ${wordCount} words from local storage?\n\nThis action cannot be undone!`
  
  if (!confirm(confirmMessage)) {
    return
  }

  // Double confirmation for safety
  if (!confirm('Are you absolutely sure? This will permanently delete all your words!')) {
    return
  }

  deleting.value = true
  error.value = ''

  try {
    // Get all German words to delete
    const allGermanWords = allWords.value.map(w => w.german)
    const remainingWords = await deleteWords(allGermanWords)
    allWords.value = remainingWords
  } catch (err) {
    error.value = 'Failed to delete all words. Please try again.'
    console.error('Error deleting all words:', err)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.word-manager-container {
  width: 100%;
  max-width: 900px;
  padding: 20px;
}

.word-manager-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.back-btn {
  background: #f0f0f0;
  color: #333;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e0e0e0;
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 10px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.cloud-stat {
  margin-left: auto;
}

.delete-all-btn {
  background: #fee;
  color: #c33;
  border: 2px solid #fcc;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-all-btn:hover:not(:disabled) {
  background: #fcc;
  transform: scale(1.05);
}

.delete-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-section {
  margin-bottom: 25px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: capitalize;
}

.filter-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.filter-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.loading,
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  padding: 15px;
  background: #fee;
  color: #c33;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.words-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 5px;
}

.word-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.word-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.word-german {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.word-article {
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.word-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.word-type-badge.noun {
  background: #e3f2fd;
  color: #1976d2;
}

.word-type-badge.verb {
  background: #f3e5f5;
  color: #7b1fa2;
}

.word-type-badge.adjective {
  background: #fff3e0;
  color: #e65100;
}

.review-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.filter-btn.review-filter {
  background: #fff3cd;
  color: #856404;
  border-color: #ffc107;
}

.filter-btn.review-filter.active {
  background: #ffc107;
  color: #333;
  border-color: #ffc107;
}

.delete-btn {
  background: #fee;
  color: #c33;
  border: 2px solid #fcc;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #fcc;
  transform: scale(1.1);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.word-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.word-translation,
.word-example,
.word-context {
  line-height: 1.6;
}

.word-translation strong,
.word-example strong,
.word-context strong {
  color: #333;
  margin-right: 8px;
}

.word-example {
  font-style: italic;
  color: #666;
}

.word-context {
  font-size: 13px;
  color: #888;
}

/* Scrollbar styling */
.words-list::-webkit-scrollbar {
  width: 8px;
}

.words-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.words-list::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

.words-list::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}
</style>

