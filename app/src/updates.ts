import {Capacitor, registerPlugin} from '@capacitor/core';

export interface WebUpdateState {
  channel: 'continuous';
  active: string;
  pending: string;
  message: string;
  error: boolean;
  checking?: boolean;
}

interface WebUpdatesPlugin {
  ready(): Promise<void>;
  getState(): Promise<WebUpdateState>;
  check(): Promise<WebUpdateState>;
}

export const supportsWebUpdates = Capacitor.getPlatform() === 'android'
  && Capacitor.isPluginAvailable('WebUpdates');
export const webUpdates = registerPlugin<WebUpdatesPlugin>('WebUpdates');

export function reportWebReady(): void {
  if (!supportsWebUpdates) return;
  void webUpdates.ready().catch(error => {
    console.error('Cannot acknowledge web update startup.', error);
    const status = document.createElement('p');
    status.setAttribute('role', 'alert');
    status.textContent = 'Cannot confirm calculator startup. The update may be rolled back on reopening.';
    document.body.prepend(status);
  });
}
