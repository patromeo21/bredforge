// ============================================================================
// BREDFORGE v1.0 — ENTRY POINT & PWA SERVICE WORKER REGISTRATION
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Mount React Root
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA Offline Support on iPad / Mobile
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Bredforge PWA Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Bredforge PWA Service Worker registration failed:', err);
      });
  });
}