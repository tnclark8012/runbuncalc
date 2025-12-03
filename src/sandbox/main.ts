import { initializeDeveloperTools } from '../extensions/ux/components/developer-tools-usage';
import { initializeSetSelectors } from '../extensions/ux/components/set-selector-usage';

document.addEventListener('DOMContentLoaded', () => {
  initializeSetSelectors();
  initializeDeveloperTools();
});