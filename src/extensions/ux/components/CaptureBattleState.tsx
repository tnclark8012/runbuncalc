/**
 * Component for capturing the current battle state
 */

import { Button } from '@fluentui/react-components';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBattleFieldState, selectTurnStartingState } from '../store/battleFieldStateSelector';
import { captureBattleState, clearCapturedStates, PlannedMoveActionState } from '../store/capturedBattleStateSlice';
import { RootState } from '../store/store';
import { useStyles } from './CaptureBattleState.styles';
import { TurnSwitcher } from './turn-switcher/TurnSwitcher';

/**
 * Component that provides a button to capture the current battle state
 */
export const CaptureBattleState: React.FC = () => {
  const styles = useStyles();
  const dispatch = useDispatch();
  const battleState = useSelector((state: RootState) => selectBattleFieldState(state));
  const startOfTurnBattleState = useSelector((state: RootState) => selectTurnStartingState(state));
  const selectedMoveName = useSelector((state: RootState) => state.move.selectedMoveName);
  const partyState = useSelector((state: RootState) => state.party);
  const trainerIndex = useSelector((state: RootState) => state.trainer.currentTrainerIndex);
  const pokemonStates = useSelector((state: RootState) => state.pokemonState);
  const fieldState = useSelector((state: RootState) => state.field);
  const currentTurnNumber = useSelector((state: RootState) => state.capturedBattleState.currentTurnNumber);
  const capturedStates = useSelector((state: RootState) => state.capturedBattleState.capturedStates);

  const handleCapture = React.useCallback(() => {
    if (!battleState) {
      console.warn('Cannot capture battle state: Missing required selections');
      return;
    }

    // Get the selected move name directly from the store
    let plannedPlayerAction: PlannedMoveActionState | undefined;
    
    if (selectedMoveName) {
      const playerPokemon = battleState.player.active[0].pokemon;
      
      plannedPlayerAction = {
        type: 'move',
        pokemonName: playerPokemon.species.name,
        move: selectedMoveName,
        mega: false, // TODO: Add UI support for mega evolution selection
        targetSlot: 0, // TODO: Support multiple targets for double battles
      };
    }

    // Capture the relevant state
    const capturedData = {
      turnNumber: currentTurnNumber,
      party: partyState,
      trainerIndex,
      pokemonStates,
      fieldState,
      plannedPlayerAction,
    };

    // Dispatch the capture action
    dispatch(captureBattleState(capturedData));

    // Log for debugging
    console.log('Captured BattleFieldState:');
    console.log(battleState);
    console.log(battleState.toString());
    console.log('Captured State Data:');
    console.log(capturedData);
  }, [battleState, selectedMoveName, partyState, trainerIndex, pokemonStates, fieldState, currentTurnNumber, dispatch]);

  const handleClear = React.useCallback(() => {
    dispatch(clearCapturedStates());
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <Button appearance="primary" onClick={handleCapture}>
          Capture Battle State
        </Button>
        <Button appearance="secondary" onClick={handleClear}>
          Clear All
        </Button>
      </div>
      <TurnSwitcher capturedStates={capturedStates} />
    </div>
  );
};
