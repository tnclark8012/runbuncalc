import {Capacitor, registerPlugin} from '@capacitor/core';

export interface SaveDocument {
  uri: string;
  name: string;
  size: number | null;
  modifiedAt: number | null;
}

export interface SaveAccessState {
  source: 'none' | 'file' | 'folder';
  access: 'unconfigured' | 'ready' | 'permission-required' | 'missing';
  folderUri: string | null;
  selectedUri: string | null;
  selectedFile: SaveDocument | null;
}

export interface SaveRead {
  document: SaveDocument;
  bytes: number;
  sha256: string;
  readAt: string;
}

export interface SaveAccessPlugin {
  getState(): Promise<SaveAccessState>;
  chooseFolder(): Promise<SaveAccessState>;
  chooseFile(): Promise<SaveAccessState>;
  listFiles(): Promise<{files: SaveDocument[]; truncated: boolean}>;
  selectFile(options: {uri: string}): Promise<SaveAccessState>;
  readSelected(): Promise<SaveRead>;
  forget(): Promise<SaveAccessState>;
}

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
