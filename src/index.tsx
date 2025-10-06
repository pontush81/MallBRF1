import React from 'react';
import ReactDOM from 'react-dom/client';
// Ultra-minimal font loading for LCP optimization
import '@fontsource/inter/400.css';
import './index.css';
import './styles/designSystem.css';

import App from './App';
// Suppress ResizeObserver error that can occur with modern responsive components
const resizeObserverErr = window.console.error;
window.console.error = (...args: any[]) => {
  if (args.length > 0 && args[0].includes && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
    return; // Suppress this specific error
  }
  resizeObserverErr.call(window.console, ...args);
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Automatisk cache-rensning för alla användare (speciellt Safari iPhone)
const clearStaleCache = async () => {
  try {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const shouldForceClear = isIOS || isSafari;
    
    // Always check for old cache versions
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('gulmaran-v1') || 
        name.includes('gulmaran-v2') || 
        name.includes('gulmaran-v3') || 
        name.includes('gulmaran-v4') ||
        name !== 'gulmaran-v5-modern-ui-update'
      );
      
      if (oldCaches.length > 0 || shouldForceClear) {
        console.log('🧹 Clearing old cache for compatibility...');
        await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
        
        // Clear storage for iOS Safari specifically
        if (shouldForceClear) {
          try {
            localStorage.removeItem('theme');
            localStorage.removeItem('user-preferences');
            sessionStorage.clear();
          } catch (e) {
            // Silent fail for storage clearing
          }
        }
      }
    }
  } catch (error) {
    // Silent fail - don't break the app
    console.log('Cache clear attempt completed');
  }
};

// Registrera vår egna service worker för att förhindra localhost-caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', async () => {
    // Clear stale cache FIRST
    await clearStaleCache();
    
    // Then register new service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Custom SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ SW registration failed:', error);
      });
  });
} else {
  // Still clear cache in development for testing
  clearStaleCache();
}

// Web vitals removed for production performance
