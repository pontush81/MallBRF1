import React from 'react';
import ReactDOM from 'react-dom/client';
// Minimal font loading - only essential weights
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './index.css';
import './styles/loading.css';
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

// Web vitals removed for production performance
