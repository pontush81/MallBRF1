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
const detectAndFixCacheIssues = async () => {
  try {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const shouldForceClear = isIOS || isSafari;
    
    // Check if we're coming from a cache clear attempt
    const urlParams = new URLSearchParams(window.location.search);
    const cacheCleared = urlParams.get('cache-cleared');
    const safariFixed = urlParams.get('safari-fix');
    
    // Always check for problematic cache versions
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('gulmaran-v1') || 
        name.includes('gulmaran-v2') || 
        name.includes('gulmaran-v3') || 
        name.includes('gulmaran-v4') ||
        (name !== 'gulmaran-v5-modern-ui-update' && name.includes('gulmaran'))
      );
      
      // More aggressive detection for cache problems
      const hasProblematicCache = oldCaches.length > 0;
      const hasStaleStorage = localStorage.getItem('app-version') !== 'v5-modern-ui-update';
      
      if (hasProblematicCache || hasStaleStorage || shouldForceClear) {
        console.log('🧹 Problematic cache detected, clearing...');
        
        // Clear all old caches
        await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
        
        // Update version marker
        localStorage.setItem('app-version', 'v5-modern-ui-update');
        
        // Clear problematic storage for all browsers
        try {
          const keysToRemove = ['theme', 'user-preferences', 'cached-pages', 'ui-state'];
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
        } catch (e) {
          console.warn('Storage clearing failed:', e);
        }
        
        // Force reload if not already attempted
        if (!cacheCleared && !safariFixed) {
          console.log('🔄 Reloading after cache clear...');
          window.location.href = window.location.pathname + '?cache-cleared=true';
          return;
        }
      }
    }
    
    // Detect white screen after 3 seconds and redirect to fix page
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
        console.warn('⚠️ White screen detected, redirecting to cache fix...');
        window.location.href = '/clear-cache.html';
      }
    }, 3000);
    
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
