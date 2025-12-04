import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SandboxApp } from './SandboxApp';

document.addEventListener('DOMContentLoaded', () => {
  const rootContainer = document.getElementById('sandbox-root');
  if (rootContainer) {
    const root = createRoot(rootContainer);
    root.render(React.createElement(SandboxApp));
  }
});