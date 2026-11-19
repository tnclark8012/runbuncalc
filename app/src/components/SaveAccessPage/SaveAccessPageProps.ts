import type {SaveAccessState, SaveDocument, SaveRead, SaveTarget} from '../../storage/save-access';

export interface SaveAccessPageProps {
  target: SaveTarget;
  state: SaveAccessState | null;
  files: SaveDocument[];
  truncated: boolean;
  result: SaveRead | null;
  busy: boolean;
  error: string | null;
  supported: boolean;
  chooseFolder(): void;
  refresh(): void;
  selectFile(uri: string): void;
  read(): void;
  forget(): void;
}
