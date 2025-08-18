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

// Registrera vår egna service worker för att förhindra localhost-caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Custom SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ SW registration failed:', error);
      });
  });
}

// Web vitals removed for production performance
