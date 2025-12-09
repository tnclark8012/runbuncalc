/**
 * Component for capturing the current battle state
 */

import { Button } from '@fluentui/react-components';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlannedMoveAction } from '../../configuration';
import { selectBattleFieldState } from '../store/battleFieldStateSelector';
import { captureBattleState } from '../store/capturedBattleStateSlice';
import { RootState } from '../store/store';
import { useStyles } from './CaptureBattleState.styles';

/**
 * Component that provides a button to capture the current battle state
 */
export const CaptureBattleState: React.FC = () => {
  const styles = useStyles();
  const dispatch = useDispatch();
  const battleState = useSelector((state: RootState) => selectBattleFieldState(state));
  const selectedMoveName = useSelector((state: RootState) => state.move.selectedMoveName);
  const partyState = useSelector((state: RootState) => state.party);
  const trainerIndex = useSelector((state: RootState) => state.trainer.currentTrainerIndex);
  const pokemonStates = useSelector((state: RootState) => state.pokemonState);
  const fieldState = useSelector((state: RootState) => state.field);
  const currentTurnNumber = useSelector((state: RootState) => state.capturedBattleState.currentTurnNumber);

  const handleCapture = React.useCallback(() => {
    if (!battleState) {
      console.warn('Cannot capture battle state: Missing required selections');
      return;
    }

    // Get the selected move name directly from the store
    let plannedPlayerAction: PlannedMoveAction | undefined;
    
    if (selectedMoveName) {
      const playerPokemon = battleState.player.active[0].pokemon;
      
      plannedPlayerAction = {
        type: 'move',
        pokemon: playerPokemon,
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

  return (
    <div className={styles.container}>
      <Button appearance="primary" onClick={handleCapture}>
        Capture Battle State
      </Button>
    </div>
  );
};
