import {Capacitor, registerPlugin} from '@capacitor/core';
import type {SaveAccessPlugin} from './save-access.contracts';
export type * from './save-access.contracts';

export const saveAccess = registerPlugin<SaveAccessPlugin>('SaveAccess');
export const supportsSaveAccess = Capacitor.getPlatform() === 'android';

export function describeSaveError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error
      && typeof error.message === 'string') return error.message;
  return 'The save operation failed. Try again or reconnect the save file.';
}

export function wasPickerCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && error.code === 'PICKER_CANCELLED';
}
