/**
 * Props for the MoveResultGroup component
 */
export interface MoveResultGroupProps {
  /**
   * Unique identifier for the radio group (e.g., "resultHeaderL" or "resultHeaderR")
   */
  headerId: string;

  /**
   * Header text displayed above the move list
   */
  headerText: string;

  /**
   * Name attribute for the radio group (all radios should share the same name)
   */
  radioGroupName: string;

  /**
   * List of moves to display in the radio group
   */
  moves: MoveItem[];

  /**
   * Callback when a move is selected
   */
  onMoveSelect?: (moveId: string) => void;

  /**
   * The currently selected move ID
   */
  selectedMoveId?: string;

  /**
   * Whether this Pokemon is faster (for highlighting)
   */
  isFaster?: boolean;
}

/**
 * Represents a single move item in the radio group
 */
export interface MoveItem {
  /**
   * Unique identifier for the move (e.g., "resultMoveL1")
   */
  id: string;

  /**
   * Display name of the move
   */
  name: string;

  /**
   * Optional custom label (overrides default formatting)
   * Used for CPU moves to include probability
   */
  label?: string;

  /**
   * Damage percentage range (e.g., "259 - 306")
   */
  damageRange: string;

  /**
   * Damage percentage display (e.g., "1126 - 1330.4%")
   */
  damagePercent: string;

  /**
   * Position in the list (top, mid, bottom) for styling
   */
  position: 'top' | 'mid' | 'bottom';

  /**
   * Whether this move is checked by default
   */
  defaultChecked?: boolean;
}
