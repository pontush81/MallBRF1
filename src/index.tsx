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

// Förbättrad cache-detection och automatisk åtgärd
// Current version - update when deploying new cache-breaking changes
const CURRENT_APP_VERSION = 'v8';

const detectAndFixCacheIssues = async () => {
  try {
    // Check if we're coming from a cache clear attempt
    const urlParams = new URLSearchParams(window.location.search);
    const cacheCleared = urlParams.get('cache-cleared');
    
    // Clean up URL if cache-cleared parameter exists
    if (cacheCleared) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    
    // Only check for very old problematic caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      // Only clear truly old caches (v1-v5), let the service worker handle v6+
      const oldCaches = cacheNames.filter(name => 
        name.includes('gulmaran-v1') || 
        name.includes('gulmaran-v2') || 
        name.includes('gulmaran-v3') || 
        name.includes('gulmaran-v4') ||
        name.includes('gulmaran-v5')
      );
      
      if (oldCaches.length > 0) {
        console.log('🧹 Old caches detected, clearing:', oldCaches);
        await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
        localStorage.setItem('app-version', CURRENT_APP_VERSION);
        
        if (!cacheCleared) {
          console.log('🔄 Reloading after cache clear...');
          window.location.href = window.location.pathname + '?cache-cleared=true';
          return;
        }
      }
    }
    
    // Update version marker if not set
    if (localStorage.getItem('app-version') !== CURRENT_APP_VERSION) {
      localStorage.setItem('app-version', CURRENT_APP_VERSION);
    }
    
    // Detect white screen after 5 seconds and redirect to fix page
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
        console.warn('⚠️ White screen detected, redirecting to cache fix...');
        window.location.href = '/clear-cache.html';
      }
    }, 5000);
    
  } catch (error) {
    console.log('Cache detection completed with errors:', error);
  }
};

// Registrera vår egna service worker för att förhindra localhost-caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', async () => {
    // Clear stale cache FIRST
    await detectAndFixCacheIssues();
    
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
  detectAndFixCacheIssues();
}

// Web vitals removed for production performance
