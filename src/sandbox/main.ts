import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SandboxApp } from './SandboxApp';

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(window.location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.error('Offline support could not be enabled.', error);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const rootContainer = document.getElementById('sandbox-root');
  if (rootContainer) {
    const root = createRoot(rootContainer);
    root.render(React.createElement(SandboxApp));
  }
});