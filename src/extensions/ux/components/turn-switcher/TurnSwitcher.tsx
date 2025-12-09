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
}

/**
 * Extract the move text from a captured battle state
 */
function getMoveText(state: CapturedBattleStateData): string {
  return state.plannedPlayerAction?.type === 'move' 
    ? state.plannedPlayerAction.move 
    : 'No move';
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
          capturedStates.map((state) => {
            const moveText = getMoveText(state);
            const stateKey = getStateKey(state);
            
            return (
              <Tooltip 
                key={stateKey} 
                content={`Turn ${state.turnNumber}: ${moveText}`} 
                relationship="label"
              >
                <Card
                  className={styles.stateCard}
                  appearance="subtle"
                >
                  <div className={styles.cardContent}>
                    <div className={styles.turnNumber}>T{state.turnNumber}</div>
                    <div className={styles.moveText}>{moveText}</div>
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
