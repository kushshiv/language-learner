<template>
  <div class="module-selector-container">
    <div class="module-selector-card">
      <h1 class="title">📖 Reading Modules</h1>
      <p class="subtitle">Select a module to continue reading</p>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading modules...</p>
      </div>

      <div v-else-if="modules.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No reading modules yet</p>
        <p class="empty-hint">Upload a completed JSON file to get started</p>
        <button @click="$emit('upload-new')" class="btn-primary">
          Upload Reading Module
        </button>
      </div>

      <div v-else class="modules-list">
        <div 
          v-for="module in modules" 
          :key="module.moduleName"
          class="module-card"
          @click="selectModule(module)"
        >
          <div class="module-header">
            <div class="module-name">{{ module.moduleName }}</div>
            <div class="module-meta">
              {{ module.totalLines }} lines
            </div>
          </div>
          <div class="module-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgressPercent(module) + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              {{ getProgressText(module) }}
            </div>
          </div>
          <div class="module-footer">
            <span class="module-date">Last updated: {{ formatDate(module.updatedAt) }}</span>
            <button 
              @click.stop="deleteModule(module.moduleName)"
              class="delete-btn"
              title="Delete module"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <button @click="$emit('upload-new')" class="btn-secondary">
        + Upload New Module
      </button>

      <button @click="$emit('back')" class="btn-back">
        ← Back
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllReadingModules, deleteReadingModule } from '../utils/readingStorage'
import type { ReadingContent } from '../types'

const emit = defineEmits<{
  (e: 'module-selected', module: ReadingContent): void
  (e: 'upload-new'): void
  (e: 'back'): void
}>()

const modules = ref<ReadingContent[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadModules()
})

const loadModules = async () => {
  loading.value = true
  try {
    modules.value = await getAllReadingModules()
  } catch (error) {
    console.error('Failed to load modules:', error)
  } finally {
    loading.value = false
  }
}

const selectModule = (module: ReadingContent) => {
  emit('module-selected', module)
}

const getProgressPercent = (module: ReadingContent): number => {
  if (module.totalLines === 0) return 0
  return Math.round(((module.currentLineIndex + 1) / module.totalLines) * 100)
}

const getProgressText = (module: ReadingContent): string => {
  if (module.totalLines === 0) return 'Not started'
  const current = module.currentLineIndex + 1
  return `Line ${current} of ${module.totalLines} (${getProgressPercent(module)}%)`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const deleteModule = async (moduleName: string) => {
  if (confirm(`Delete "${moduleName}"? This cannot be undone.`)) {
    try {
      await deleteReadingModule(moduleName)
      await loadModules()
    } catch (error) {
      console.error('Failed to delete module:', error)
      alert('Failed to delete module')
    }
  }
}
</script>

<style scoped>
.module-selector-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.module-selector-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.empty-hint {
  color: #999;
  font-size: 14px;
  margin-bottom: 20px;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.module-card {
  background: #f8f9ff;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.module-card:hover {
  border-color: #667eea;
  background: #f0f0ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.module-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  flex: 1;
}

.module-meta {
  font-size: 14px;
  color: #666;
  background: white;
  padding: 5px 12px;
  border-radius: 12px;
}

.module-progress {
  margin-bottom: 15px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
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

.module-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-date {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fee;
  transform: scale(1.1);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
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
  cursor: pointer;
  margin-bottom: 15px;
  border: none;
}

.btn-back {
  background: transparent;
  color: #667eea;
  padding: 10px 20px;
  border: 2px solid #667eea;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
}
</style>

