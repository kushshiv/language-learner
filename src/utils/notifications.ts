/**
 * Request notification permission and show browser notification
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Show a browser notification
 */
export async function showNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  
  if (!hasPermission) {
    console.log('Notification permission not granted')
    return
  }

  // Show browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/language-learner/favicon.ico',
      badge: '/language-learner/favicon.ico',
      tag: 'streak-notification',
      requireInteraction: false,
      ...options
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  // Also try service worker notification if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        ...options
      })
    } catch (error) {
      console.error('Failed to send notification to service worker:', error)
    }
  }
}

/**
 * Schedule daily streak reminder notifications
 */
export async function scheduleStreakNotifications(): Promise<void> {
  // Check if notifications are already scheduled
  const scheduled = localStorage.getItem('streak-notifications-scheduled')
  if (scheduled === 'true') {
    // Still notify service worker to start checking
    notifyServiceWorkerToStart()
    return // Already scheduled
  }

  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    return
  }

  // Schedule notifications for 9:30 AM, 3 PM, and 9 PM (in user's local timezone)
  localStorage.setItem('streak-notifications-scheduled', 'true')
  
  // Store notification times
  // Note: Times are in the user's local timezone
  // If you want CET specifically, the app will use 9:30 AM in your device's timezone
  const notificationTimes = [
    { hour: 9, minute: 30, label: 'morning' },
    { hour: 15, minute: 0, label: 'afternoon' },
    { hour: 21, minute: 0, label: 'night' }
  ]
  
  localStorage.setItem('streak-notification-times', JSON.stringify(notificationTimes))
  
  // Store daily goal in service worker accessible storage
  const { getDailyGoal } = await import('./streakStorage')
  const dailyGoal = await getDailyGoal()
  await syncStorageToServiceWorker('streak-daily-goal', dailyGoal.toString())
  await syncStorageToServiceWorker('streak-notification-times', JSON.stringify(notificationTimes))
  
  // Start checking for notification times (both in main thread and service worker)
  startNotificationChecker()
  notifyServiceWorkerToStart()
  
  // Try to register periodic background sync if available
  await registerPeriodicSync()
}

/**
 * Sync storage value to service worker cache
 */
async function syncStorageToServiceWorker(key: string, value: string): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_STORAGE',
        key,
        value
      })
    } catch (error) {
      console.error('Failed to sync storage to service worker:', error)
    }
  }
}

/**
 * Notify service worker to start checking notifications
 */
function notifyServiceWorkerToStart(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'START_NOTIFICATIONS'
      })
    } catch (error) {
      console.error('Failed to notify service worker:', error)
    }
  }
}

/**
 * Register periodic background sync if available
 */
async function registerPeriodicSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'periodicSync' in (await navigator.serviceWorker.ready).registration) {
    try {
      const registration = await navigator.serviceWorker.ready
      if ('periodicSync' in registration) {
        await registration.periodicSync.register('streak-notifications', {
          minInterval: 60 * 60 * 1000 // Check every hour
        })
        console.log('Periodic background sync registered')
      }
    } catch (error) {
      console.warn('Periodic background sync not available:', error)
      // This is expected on many browsers - not a critical feature
    }
  }
}

/**
 * Start checking if it's time to show a notification
 */
function startNotificationChecker(): void {
  // Check every minute if it's time to show a notification
  setInterval(() => {
    checkAndShowNotification()
  }, 60000) // Check every minute
  
  // Also check immediately
  checkAndShowNotification()
}

/**
 * Check if it's time to show a notification and show it
 */
async function checkAndShowNotification(): Promise<void> {
  const timesStr = localStorage.getItem('streak-notification-times')
  if (!timesStr) return

  // Get daily goal dynamically
  const { getDailyGoal } = await import('./streakStorage')
  const dailyGoal = await getDailyGoal()

  const times = JSON.parse(timesStr) as Array<{ hour: number; minute: number; label: string }>
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Check if we've already shown notification for this time slot today
  const today = now.toISOString().split('T')[0]
  
  for (const time of times) {
    // Check if current time matches notification time (within 1 minute window)
    if (currentHour === time.hour && currentMinute === time.minute) {
      const notificationKey = `streak-notification-${time.label}-${today}`
      const alreadyShown = localStorage.getItem(notificationKey)
      
      if (!alreadyShown) {
        // Show notification
        await showNotification(
          '🔥 Daily Streak Reminder',
          `Don't forget to practice ${dailyGoal} unique words today to maintain your streak!`,
          {
            tag: `streak-reminder-${time.label}`,
            requireInteraction: false
          }
        )
        
        // Mark as shown
        localStorage.setItem(notificationKey, 'true')
        localStorage.setItem('last-streak-notification-date', today)
      }
    }
  }
}

/**
 * Cancel scheduled notifications
 */
export function cancelStreakNotifications(): void {
  localStorage.removeItem('streak-notifications-scheduled')
  localStorage.removeItem('streak-notification-times')
  localStorage.removeItem('last-streak-notification-date')
  
  // Clear all notification keys for today
  const today = new Date().toISOString().split('T')[0]
  const keys = ['streak-notification-morning', 'streak-notification-afternoon', 'streak-notification-night']
  keys.forEach(key => {
    localStorage.removeItem(`${key}-${today}`)
  })
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return localStorage.getItem('streak-notifications-scheduled') === 'true'
}

