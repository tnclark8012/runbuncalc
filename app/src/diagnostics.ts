import {registerPlugin} from '@capacitor/core';
import type {DiagnosticBridge} from '../../src/extensions/ux/bug-report/contracts';
import {saveAccess, supportsSaveAccess} from './storage/save-access';

interface DiagnosticsPlugin {
  captureScreenshot(): Promise<{dataBase64: string}>;
  getAppInfo(): Promise<Record<string, unknown>>;
  saveZip(options: {name: string; dataBase64: string}): Promise<{name: string}>;
  copyFilename(options: {name: string}): Promise<void>;
  openIssue(options: {url: string}): Promise<void>;
}

const diagnostics = registerPlugin<DiagnosticsPlugin>('Diagnostics');

export function initializeNativeDiagnostics(): void {
  if (!supportsSaveAccess) return;
  const bridge: DiagnosticBridge = {
    async readCurrentJg() {
      const state = await saveAccess.getState();
      if (!state.selectedFile) throw new Error('No JG file is connected.');
      const read = await saveAccess.readSelected({includeData: true});
      if (!read.dataBase64) throw new Error('The connected JG file returned no bytes.');
      return {
        name: read.document.name,
        dataBase64: read.dataBase64,
        metadata: {bytes: read.bytes, sha256: read.sha256, readAt: read.readAt},
      };
    },
    async captureScreenshot() {
      return (await diagnostics.captureScreenshot()).dataBase64;
    },
    getAppInfo: () => diagnostics.getAppInfo(),
    async saveZip(name, dataBase64) {
      return (await diagnostics.saveZip({name, dataBase64})).name;
    },
    copyFilename: name => diagnostics.copyFilename({name}),
    openIssue: url => diagnostics.openIssue({url}),
  };
  window.runbunDiagnostics = bridge;
}
