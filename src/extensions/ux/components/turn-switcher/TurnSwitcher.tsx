/**
 * TurnSwitcher component - displays captured battle states in a horizontal list
 */

import { Card, Label, Tooltip } from '@fluentui/react-components';
import * as React from 'react';
import { CapturedBattleStateData, deselectTurn, selectTurn } from '../../store/capturedBattleStateSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
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
  const dispatch = useAppDispatch();
  const selectedTurnIndex = useAppSelector(state => state.capturedBattleState.selectedTurnIndex);

  const handleTurnClick = React.useCallback((index: number) => {
    if (selectedTurnIndex === index) {
      // Clicking the selected turn deselects it (returns to live state)
      dispatch(deselectTurn());
    } else {
      dispatch(selectTurn(index));
    }
  }, [dispatch, selectedTurnIndex]);

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
            const moveText = getMoveText(state);
            const stateKey = getStateKey(state);
            const isSelected = selectedTurnIndex === index;
            
            return (
              <Tooltip 
                key={stateKey} 
                content={`Turn ${state.turnNumber}: ${moveText}`} 
                relationship="label"
              >
                <Card
                  className={styles.stateCard}
                  appearance={isSelected ? 'filled' : 'subtle'}
                  onClick={() => handleTurnClick(index)}
                  style={{ cursor: 'pointer' }}
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
