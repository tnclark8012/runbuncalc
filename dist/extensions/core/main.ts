import * as coreExtensions from './window';
(window as any).core = coreExtensions;
window.onerror = function (message, source, lineno, colno, error) {
  console.error(message, error);
  alert(message);
};