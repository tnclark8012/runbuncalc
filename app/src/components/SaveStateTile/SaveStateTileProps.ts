import type {SaveDocument} from '../../storage/save-access';

export interface SaveStateTileProps {
  file: SaveDocument;
  selected: boolean;
  onSelect(uri: string): void;
}
