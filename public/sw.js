// Simple service worker for better caching
// Enhanced version with better cleanup and fallback handling

const CACHE_NAME = 'gulmaran-v6-mobile-fix-2025';
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
  // Note: Don't hardcode CSS/JS files as they have dynamic names with hashes
];

// Install event - cache static assets and cleanup aggressively
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache new assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          return Promise.allSettled(
            STATIC_ASSETS.map(url => 
              cache.add(url).catch(() => console.log(`Failed to cache: ${url}`))
            )
          );
        }),
      // Immediately cleanup old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.includes('gulmaran')) {
              console.log('🧹 SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('✅ SW: Installation complete, taking control immediately');
      self.skipWaiting();
    })
  );
});

// Activate event - take control immediately and cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Cleanup old caches again (double-check)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🧹 SW: Cleaning up cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim().then(() => {
        console.log('✅ SW: Now controlling all clients');
      })
    ])
  );
});

// Fetch event - serve from cache when possible, always fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API calls and dynamic content
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available, otherwise fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Always fallback to network if cache fails
        return fetch(event.request);
      })
  );
});