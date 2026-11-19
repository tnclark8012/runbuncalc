export interface SaveDocument {
  uri: string;
  name: string;
  size: number | null;
  modifiedAt: number | null;
  preview?: SaveDocument;
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
  dataBase64?: string;
}

export type SaveTarget = 'snapshot' | 'rom';
export interface SaveTargetOptions {target?: SaveTarget}

export interface SaveAccessPlugin {
  getState(options?: SaveTargetOptions): Promise<SaveAccessState>;
  chooseFolder(options?: SaveTargetOptions): Promise<SaveAccessState>;
  chooseFile(options?: SaveTargetOptions): Promise<SaveAccessState>;
  listFiles(options?: SaveTargetOptions): Promise<{files: SaveDocument[]; truncated: boolean}>;
  selectFile(options: SaveTargetOptions & {uri: string}): Promise<SaveAccessState>;
  readSelected(options?: SaveTargetOptions & {includeData?: boolean}): Promise<SaveRead>;
  forget(options?: SaveTargetOptions): Promise<SaveAccessState>;
}
