// Service Worker for Gulmaran
// Version 8: Fixed reload loop, network-first for HTML

const CACHE_VERSION = 'v8';
const CACHE_NAME = 'gulmaran-' + CACHE_VERSION;

// Only cache these stable assets (not index.html!)
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico'
];

// Install event - skip waiting to take control immediately
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(() => console.log(`Failed to cache: ${url}`))
          )
        );
      })
      .then(() => {
        console.log('✅ SW: Installed, skipping wait');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup ALL old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating version:', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(name => name !== CACHE_NAME && name.startsWith('gulmaran'));
        if (oldCaches.length > 0) {
          console.log('🧹 SW: Deleting old caches:', oldCaches);
        }
        return Promise.all(
          oldCaches.map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('✅ SW: Taking control of all clients');
        return self.clients.claim();
      })
      // NOTE: Removed automatic reload notification to prevent infinite loops
  );
});

// Fetch event - NETWORK-FIRST for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip non-same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API calls and Supabase
  if (url.pathname.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  // CRITICAL: Network-first for HTML documents (navigation requests)
  // This ensures we always get the latest index.html with correct asset hashes
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname === '/' ||
      url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets (JS, CSS with hash in filename) - cache-first is safe
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return fetchResponse;
          });
        })
    );
    return;
  }

  // Default: network only (don't cache dynamic content)
  event.respondWith(fetch(event.request));
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      if (event.source) {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      }
    });
  }
});
