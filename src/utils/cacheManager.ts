// Automatisk cache-hantering för att förhindra Safari iPhone problem
export const AUTO_CACHE_VERSION = 'gulmaran-v5-modern-ui-update';

export const detectProblemBrowser = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isOldWebView = navigator.userAgent.includes('Version/') && navigator.userAgent.includes('Mobile/');
  
  return {
    isIOS,
    isSafari,
    isOldWebView,
    needsForceRefresh: isIOS || isSafari || isOldWebView
  };
};

export const clearAllStaleData = async () => {
  const browser = detectProblemBrowser();
  let clearedItems = 0;
  
  try {
    // 1. Clear old caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const staleCaches = cacheNames.filter(name => name !== AUTO_CACHE_VERSION);
      
      for (const cacheName of staleCaches) {
        await caches.delete(cacheName);
        clearedItems++;
      }
    }
    
    // 2. Unregister old service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const sw = registration.active || registration.waiting || registration.installing;
        if (sw && sw.scriptURL.includes('/sw.js')) {
          // Only unregister if it's an old version
          await registration.unregister();
          clearedItems++;
        }
      }
    }
    
    // 3. Clear problematic storage for Safari/iOS
    if (browser.needsForceRefresh) {
      try {
        // Only clear app-specific data, not user data
        const keysToRemove = ['theme', 'ui-state', 'temp-data'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        clearedItems++;
      } catch (e) {
        // Storage access might be restricted
      }
    }
    
    return { success: true, itemsCleared: clearedItems, browser };
  } catch (error) {
    return { success: false, error: error.message, browser };
  }
};

export const initCacheManagement = async () => {
  // Run automatic cleanup on app start
  const result = await clearAllStaleData();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cache cleanup result:', result);
  }
  
  // For Safari iPhone, add additional fixes
  if (result.browser.isIOS && result.browser.isSafari) {
    // Prevent zoom on input focus (common iOS Safari issue)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
    
    // Force repaint after cache clear
    setTimeout(() => {
      document.body.style.transform = 'translateZ(0)';
      setTimeout(() => {
        document.body.style.transform = '';
      }, 100);
    }, 500);
  }
  
  return result;
};
