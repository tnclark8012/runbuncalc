import {describeSaveError, saveAccess, supportsSaveAccess} from './storage/save-access';
import {syncSelectedSnapshot} from './sync/sync';

declare global {
  interface Window {
    extensions?: {importBoxJson(json: string): void};
  }
}

const controls = document.getElementById('app-controls');
if (!controls) throw new Error('App sync controls are missing.');
if (supportsSaveAccess) {
  controls.hidden = false;
  const button = document.getElementById('app-sync');
  const status = document.getElementById('app-sync-status');
  if (!(button instanceof HTMLButtonElement) || !status) throw new Error('App sync controls are incomplete.');
  let busy = false;
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    status.setAttribute('role', 'status');
    status.textContent = 'Reading and decoding selected files...';
    try {
      const importer = window.extensions?.importBoxJson;
      if (!importer) throw new Error('The calculator has not loaded. Reopen the app and retry.');
      const result = await syncSelectedSnapshot(saveAccess, importer);
      status.textContent = `Synced ${result.pokemon} Pokemon at ${new Date().toLocaleTimeString()}. ${result.warnings.join(' ')}`;
    } catch (error) {
      status.setAttribute('role', 'alert');
      status.textContent = `Sync failed: ${describeSaveError(error)}`;
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
}
