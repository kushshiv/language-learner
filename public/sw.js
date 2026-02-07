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

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  self.clients.claim()
})

