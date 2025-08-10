// Custom Service Worker för MallBRF
// Förhindrar caching av localhost URLs på produktion

const CACHE_NAME = 'mallbrf-v1';
const PRODUCTION_DOMAIN = 'www.gulmaran.com';

// Kontrollera om vi är på produktion
const isProduction = () => {
  return location.hostname === PRODUCTION_DOMAIN || 
         location.hostname.includes('gulmaran.com');
};

// Installera service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  // Rensa gamla caches som innehåller localhost
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const localhostCaches = cacheNames.filter(name => 
        name.includes('localhost') || 
        name.includes('3000') ||
        name.includes('workbox') // Rensa gamla workbox caches
      );
      
      if (localhostCaches.length > 0) {
        console.log('🧹 Clearing old localhost caches:', localhostCaches);
        return Promise.all(
          localhostCaches.map(name => caches.delete(name))
        );
      }
    })
  );
  
  self.skipWaiting();
});

// Aktivera service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Rensa alla gamla caches utom den aktuella
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Hantera fetch requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // VIKTIGT: Blockera alla requests till localhost på produktion
  if (isProduction() && (
    requestUrl.hostname === 'localhost' || 
    requestUrl.port === '3000' ||
    requestUrl.hostname.includes('127.0.0.1')
  )) {
    console.warn('🚫 Blocked localhost request on production:', event.request.url);
    return; // Blockera requesten helt
  }
  
  // För produktion: bara cacha statiska assets från vår domän
  if (isProduction() && requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('📦 PWA: Hämtar från cache:', event.request.url);
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Cacha bara framgångsrika responses för statiska filer
          if (response.status === 200 && 
              (event.request.url.includes('/static/') || 
               event.request.url.includes('.css') ||
               event.request.url.includes('.js') ||
               event.request.url.includes('.png') ||
               event.request.url.includes('.jpg') ||
               event.request.url.includes('.ico'))) {
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              console.log('💾 PWA: Uppdaterade cache från nätverk:', event.request.url);
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        });
      })
    );
  }
});

// Hantera meddelanden
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({success: true});
      })
    );
  }
});

console.log('🚀 Custom Service Worker loaded for MallBRF');
