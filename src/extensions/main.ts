import * as windowExtensions from './window';
import { initializeUx } from './ux/initialize';
(window as any).extensions = windowExtensions;
domReady(async () => {
  initializeUx();
  window.dispatchEvent(new Event('runbuncalc:ready'));
});

function domReady(callback: () => void) {
  // If the DOM is already ready, execute the callback immediately
  if (document.readyState !== "loading") {
    callback();
  } else {
    // Otherwise, wait for the DOMContentLoaded event
    document.addEventListener("DOMContentLoaded", callback);
  }
}