<template>
  <div class="streak-calendar-container">
    <div class="calendar-header">
      <h3 class="calendar-title">🔥 Streak Calendar</h3>
      <div class="streak-stats">
        <div class="stat-item">
          <span class="stat-label">Current Streak:</span>
          <span class="stat-value">{{ currentStreak }} days</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Today's Progress:</span>
          <span class="stat-value">{{ todayProgress.currentCount }} / {{ todayProgress.goal }}</span>
        </div>
      </div>
    </div>

    <div class="achievements-section">
      <h4 class="section-title">Achievements</h4>
      <div class="achievements-list">
        <div
          v-for="achievement in achievements"
          :key="achievement.milestone"
          class="achievement-item"
          :class="{ achieved: achievement.achieved }"
        >
          <span class="achievement-icon">{{ achievement.achieved ? '✅' : '⏳' }}</span>
          <span class="achievement-text">{{ achievement.milestone }} ({{ achievement.days }} days)</span>
        </div>
      </div>
    </div>

    <div class="calendar-section">
      <h4 class="section-title">Recent Activity</h4>
      <div class="calendar-grid">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="calendar-day"
          :class="{
            completed: day.completed,
            today: day.isToday,
            future: day.isFuture
          }"
          :title="day.tooltip"
        >
          <div class="day-date">{{ day.dayNumber }}</div>
          <div class="day-status">
            <span v-if="day.completed" class="status-icon">✓</span>
            <span v-else-if="day.count > 0" class="status-partial">{{ day.count }}</span>
            <span v-else-if="!day.isFuture" class="status-missed">✗</span>
          </div>
        </div>
      </div>
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-color completed"></div>
          <span>Completed</span>
        </div>
        <div class="legend-item">
          <div class="legend-color partial"></div>
          <span>Partial</span>
        </div>
        <div class="legend-item">
          <div class="legend-color missed"></div>
          <span>Missed</span>
        </div>
        <div class="legend-item">
          <div class="legend-color today"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStreakHistory, getCurrentStreak, getTodayProgress, getAchievements, syncStreakDataFromCloud } from '../lib/streakStorage'
import { isCloudSyncEnabled } from '../../words/lib/wordStorage'
import type { StreakDay } from '../../../shared/types'

const streakHistory = ref<StreakDay[]>([])
const currentStreak = ref(0)
const todayProgress = ref({ currentCount: 0, goal: 30, completed: false })
const achievements = ref<Array<{ milestone: string; achieved: boolean; days: number }>>([])

const loadData = async () => {
  streakHistory.value = await getStreakHistory()
  currentStreak.value = await getCurrentStreak()
  todayProgress.value = await getTodayProgress()
  achievements.value = await getAchievements()
}

onMounted(async () => {
  // If cloud sync is enabled on this device, make sure we
  // pull the latest streak data from the GitHub Gist before
  // rendering the calendar, so mobile and desktop stay in sync.
  try {
    const cloudEnabled = await isCloudSyncEnabled()
    if (cloudEnabled) {
      await syncStreakDataFromCloud()
    }
  } catch (e) {
    console.warn('Failed to sync streak data from cloud:', e)
  }

  await loadData()
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const calendarDays = computed(() => {
  const days: Array<{
    date: string
    dayNumber: number
    completed: boolean
    count: number
    isToday: boolean
    isFuture: boolean
    tooltip: string
  }> = []
  
  // Show last 30 days + today
  const todayDate = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(todayDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayData = streakHistory.value.find(d => d.date === dateStr)
    
    const isToday = dateStr === today.value
    const isFuture = date > todayDate
    const count = dayData?.count || 0
    const completed = dayData?.completed || false
    
    days.push({
      date: dateStr,
      dayNumber: date.getDate(),
      completed,
      count,
      isToday,
      isFuture,
      tooltip: isToday 
        ? `Today: ${count} words practiced`
        : isFuture
        ? 'Future'
        : completed
        ? `${dateStr}: Completed (${count} words)`
        : count > 0
        ? `${dateStr}: ${count} words practiced`
        : `${dateStr}: No practice`
    })
  }
  
  return days
})
</script>

<style scoped>
.streak-calendar-container {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-top: 20px;
}

.calendar-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.calendar-title {
  font-size: 22px;
  color: #333;
  margin: 0 0 15px 0;
}

.streak-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.stat-value {
  font-size: 18px;
  color: #667eea;
  font-weight: 700;
}

.achievements-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  opacity: 0.6;
}

.achievement-item.achieved {
  background: #e8f5e9;
  opacity: 1;
}

.achievement-icon {
  font-size: 20px;
}

.achievement-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.calendar-section {
  margin-top: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 15px;
}

.calendar-day {
  aspect-ratio: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9f9f9;
  position: relative;
}

.calendar-day:hover {
  transform: scale(1.05);
  z-index: 1;
}

.calendar-day.completed {
  background: #4caf50;
  border-color: #45a049;
  color: white;
}

.calendar-day.today {
  border-color: #667eea;
  border-width: 3px;
  background: #f8f9ff;
}

.calendar-day.today.completed {
  background: #4caf50;
  border-color: #45a049;
}

.calendar-day.future {
  opacity: 0.3;
  cursor: not-allowed;
}

.day-date {
  font-size: 12px;
  font-weight: 600;
}

.day-status {
  font-size: 10px;
  margin-top: 2px;
}

.status-icon {
  font-size: 14px;
}

.status-partial {
  color: #ff9800;
  font-weight: 600;
}

.status-missed {
  color: #f44336;
  font-size: 12px;
}

.calendar-day.completed .day-date,
.calendar-day.completed .status-icon {
  color: white;
}

.calendar-legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.legend-color.completed {
  background: #4caf50;
  border-color: #45a049;
}

.legend-color.partial {
  background: #fff3e0;
  border-color: #ff9800;
}

.legend-color.missed {
  background: #ffebee;
  border-color: #f44336;
}

.legend-color.today {
  background: #f8f9ff;
  border-color: #667eea;
}
</style>

