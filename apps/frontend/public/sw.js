const CACHE_NAME = 'german-learner-v2'
const STATIC_CACHE_NAME = 'german-learner-static-v2'

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened static cache')
        // Only cache static assets, not app files
        return cache.addAll([
          '/language-learner/icon-192.png',
          '/language-learner/icon-512.png',
          '/language-learner/manifest.json'
        ])
      })
      .catch((err) => {
        console.log('Cache add failed:', err)
      })
  )
  self.skipWaiting()
})

// Fetch event - network-first for app files, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isStaticAsset = url.pathname.includes('/icon-') || 
                        url.pathname.includes('/manifest.json') ||
                        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)

  if (isStaticAsset) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then((fetchResponse) => {
            // Cache the fetched response
            const responseClone = fetchResponse.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
            return fetchResponse
          })
        })
    )
  } else {
    // Network-first strategy for app files (HTML, JS, CSS)
    // This ensures we always get the latest version
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network request succeeds, return it
          // Optionally cache for offline use
          const responseClone = response.clone()
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // If network fails, try cache (for offline support)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // If no cache and it's a document request, return index.html
            if (event.request.destination === 'document') {
              return caches.match('/language-learner/index.html')
            }
          })
        })
    )
  }
})

// Helper functions for storage access in service worker
async function getStorageValue(key) {
  try {
    const cache = await caches.open('streak-data')
    const response = await cache.match(`storage:${key}`)
    if (response) {
      return await response.text()
    }
  } catch (e) {
    console.warn('Cache access failed:', e)
  }
  return null
}

async function setStorageValue(key, value) {
  try {
    const cache = await caches.open('streak-data')
    await cache.put(`storage:${key}`, new Response(value))
  } catch (e) {
    console.warn('Cache write failed:', e)
  }
}

async function getDailyGoalFromStorage() {
  try {
    const goalStr = await getStorageValue('streak-daily-goal')
    if (goalStr) {
      return parseInt(goalStr, 10) || 30
    }
  } catch (e) {
    console.warn('Failed to get daily goal:', e)
  }
  return 30 // Default
}

// Check and show streak notification from service worker
async function checkAndShowStreakNotification() {
  try {
    const timesStr = await getStorageValue('streak-notification-times')
    if (!timesStr) return

    const times = JSON.parse(timesStr)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const today = now.toISOString().split('T')[0]

    for (const time of times) {
      if (currentHour === time.hour && currentMinute === time.minute) {
        const notificationKey = `streak-notification-${time.label}-${today}`
        const alreadyShown = await getStorageValue(notificationKey)
        
        if (!alreadyShown) {
          const dailyGoal = await getDailyGoalFromStorage()
          
          await self.registration.showNotification('🔥 Daily Streak Reminder', {
            body: `Don't forget to practice ${dailyGoal} unique words today to maintain your streak!`,
            icon: '/language-learner/icon-192.png',
            badge: '/language-learner/icon-192.png',
            tag: `streak-reminder-${time.label}`,
            requireInteraction: false
          })
          
          await setStorageValue(notificationKey, 'true')
        }
      }
    }
  } catch (error) {
    console.error('Error checking streak notifications:', error)
  }
}

// Set up periodic checking (every minute when service worker is active)
let notificationCheckInterval = null

async function startNotificationChecking() {
  // Clear any existing interval
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval)
  }
  
  // Check immediately
  await checkAndShowStreakNotification()
  
  // Then check every minute
  notificationCheckInterval = setInterval(() => {
    checkAndShowStreakNotification()
  }, 60000) // Every minute
}

// Activate event - clean up old caches and start notification checking
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME && cacheName !== 'streak-data')
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      // Start notification checking
      startNotificationChecking()
    ])
  )
  self.clients.claim()
})

// Periodic background sync for notifications (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'streak-notifications') {
      event.waitUntil(checkAndShowStreakNotification())
    }
  })
}

// Handle messages from the app (for notifications and storage updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, ...options } = event.data
    self.registration.showNotification(title, {
      body,
      icon: '/language-learner/icon-192.png',
      badge: '/language-learner/icon-192.png',
      tag: 'streak-notification',
      requireInteraction: false,
      ...options
    })
  } else if (event.data && event.data.type === 'UPDATE_STORAGE') {
    // Update storage in service worker cache
    const { key, value } = event.data
    setStorageValue(key, value)
  } else if (event.data && event.data.type === 'START_NOTIFICATIONS') {
    // Start notification checking
    startNotificationChecking()
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes('/language-learner/') && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/language-learner/')
      }
    })
  )
})
