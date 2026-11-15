import type {SaveAccessState, SaveDocument, SaveRead} from '../../storage/save-access';

export interface SaveAccessPageProps {
  state: SaveAccessState | null;
  files: SaveDocument[];
  truncated: boolean;
  result: SaveRead | null;
  busy: boolean;
  error: string | null;
  supported: boolean;
  chooseFile(): void;
  chooseFolder(): void;
  refresh(): void;
  selectFile(uri: string): void;
  read(): void;
  forget(): void;
}
