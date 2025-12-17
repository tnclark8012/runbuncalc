/**
 * TurnSwitcher component - displays captured battle states in a horizontal list
 */

import { Card, Label, Tooltip } from '@fluentui/react-components';
import * as React from 'react';
import { CapturedBattleStateData } from '../../store/capturedBattleStateSlice';
import { useStyles } from './TurnSwitcher.styles';

export interface TurnSwitcherProps {
  /**
   * Array of captured battle states
   */
  capturedStates: CapturedBattleStateData[];
  /**
   * Index of the currently selected state
   */
  selectedStateIndex: number | null;
  /**
   * Callback when a state is selected
   */
  onSelectState: (index: number) => void;
}

/**
 * Extract the move text from a captured battle state
 */
function getTurnLabel(state: CapturedBattleStateData): string {
  return state.plannedPlayerAction?.type === 'move' 
    ? state.plannedPlayerAction.move 
    : state.plannedPlayerAction!.pokemonSpecies;
}

/**
 * Generate a unique key for a captured state based on turn number and trainer index
 */
function getStateKey(state: CapturedBattleStateData): string {
  return `turn-${state.turnNumber}-trainer-${state.trainerIndex}`;
}

/**
 * TurnSwitcher component - displays the captured battle states in a horizontal row
 */
export const TurnSwitcher: React.FC<TurnSwitcherProps> = ({
  capturedStates,
  selectedStateIndex,
  onSelectState,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Label weight="semibold" size="medium">
        Captured States
      </Label>
      <div className={styles.statesRow}>
        {capturedStates.length === 0 ? (
          <span className={styles.emptyState}>
            No battle states captured
          </span>
        ) : (
          capturedStates.map((state, index) => {
            const turnLabel = getTurnLabel(state);
            const stateKey = getStateKey(state);
            const isSelected = selectedStateIndex === index;
            
            return (
              <Tooltip 
                key={stateKey} 
                content={`Turn ${state.turnNumber}: ${turnLabel}`} 
                relationship="label"
              >
                <Card
                  className={`${styles.stateCard} ${isSelected ? styles.stateCardSelected : ''}`}
                  appearance="subtle"
                  onClick={() => onSelectState(index)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.turnNumber}>T{state.turnNumber}</div>
                    <div className={styles.moveText}>{turnLabel}</div>
                  </div>
                </Card>
              </Tooltip>
            );
          })
        )}
      </div>
    </div>
  );
};
