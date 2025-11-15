/**
 * Custom storage adapter for redux-persist that uses browser sync storage when available,
 * falling back to localStorage.
 * 
 * Browser sync storage (like chrome.storage.sync) allows data to sync across devices
 * when the user is signed into their browser.
 */

interface StorageEngine {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

/**
 * Check if chrome.storage.sync is available
 */
function isSyncStorageAvailable(): boolean {
  return typeof globalThis !== 'undefined' &&
         'chrome' in globalThis &&
         typeof (globalThis as any).chrome === 'object' &&
         (globalThis as any).chrome !== null &&
         'storage' in (globalThis as any).chrome &&
         'sync' in (globalThis as any).chrome.storage;
}

/**
 * Get chrome.storage.sync API safely
 */
function getChromeSync(): typeof chrome.storage.sync | null {
  if (isSyncStorageAvailable()) {
    return (globalThis as any).chrome.storage.sync;
  }
  return null;
}

/**
 * Storage adapter that uses chrome.storage.sync when available,
 * falls back to localStorage otherwise
 */
const syncStorage: StorageEngine = {
  async getItem(key: string): Promise<string | null> {
    const chromeSync = getChromeSync();
    if (chromeSync) {
      try {
        const result = await chromeSync.get(key);
        return result[key] || null;
      } catch (error) {
        console.warn('Failed to get from sync storage, falling back to localStorage:', error);
        return localStorage.getItem(key);
      }
    }
    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const chromeSync = getChromeSync();
    if (chromeSync) {
      try {
        await chromeSync.set({ [key]: value });
        // Also save to localStorage as a backup
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('Failed to set in sync storage, falling back to localStorage:', error);
        localStorage.setItem(key, value);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    const chromeSync = getChromeSync();
    if (chromeSync) {
      try {
        await chromeSync.remove(key);
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from sync storage, falling back to localStorage:', error);
        localStorage.removeItem(key);
      }
    } else {
      localStorage.removeItem(key);
    }
  },
};

export default syncStorage;
