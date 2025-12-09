/**
 * Component for capturing the current battle state
 */

import { Button } from '@fluentui/react-components';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlannedMoveAction } from '../../configuration';
import { calculateAllMoves } from '../../simulator/moveScoring';
import { gen } from '../../configuration';
import { selectBattleFieldState } from '../store/battleFieldStateSelector';
import { captureBattleState } from '../store/capturedBattleStateSlice';
import { RootState } from '../store/store';

/**
 * Regular expression to extract move index from move ID (e.g., "playerMove0" -> 0)
 * Must match the ID format used in PlayerMoves component
 */
const PLAYER_MOVE_ID_PATTERN = /playerMove(\d+)/;

/**
 * Component that provides a button to capture the current battle state
 */
export const CaptureBattleState: React.FC = () => {
  const dispatch = useDispatch();
  const battleState = useSelector((state: RootState) => selectBattleFieldState(state));
  const selectedMoveId = useSelector((state: RootState) => state.move.selectedMoveId);
  const setState = useSelector((state: RootState) => state.set);
  const partyState = useSelector((state: RootState) => state.party);
  const trainerState = useSelector((state: RootState) => state.trainer);
  const pokemonStates = useSelector((state: RootState) => state.pokemonState);

  const handleCapture = React.useCallback(() => {
    if (!battleState) {
      console.warn('Cannot capture battle state: Missing required selections');
      return;
    }

    // Get the selected move name from the selectedMoveId
    let plannedPlayerAction: PlannedMoveAction | undefined;
    
    if (selectedMoveId) {
      // Extract the move index from the selectedMoveId (e.g., "playerMove0" -> 0)
      const moveIndexMatch = selectedMoveId.match(PLAYER_MOVE_ID_PATTERN);
      if (moveIndexMatch) {
        const moveIndex = parseInt(moveIndexMatch[1], 10);
        
        // Calculate the moves to get the move name
        const results = calculateAllMoves(
          gen,
          battleState.player.active[0].pokemon,
          battleState.cpu.active[0].pokemon,
          battleState.playerField
        );
        
        if (results[moveIndex]) {
          const moveName = results[moveIndex].move.name;
          const playerPokemon = battleState.player.active[0].pokemon;
          
          plannedPlayerAction = {
            type: 'move',
            pokemon: playerPokemon,
            move: moveName,
            mega: false, // TODO: Add UI support for mega evolution selection
            targetSlot: 0, // TODO: Support multiple targets for double battles
          };
        }
      }
    }

    // Capture the relevant state
    const capturedData = {
      timestamp: Date.now(),
      sets: setState,
      party: partyState,
      trainer: trainerState,
      pokemonStates,
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
  }, [battleState, selectedMoveId, setState, partyState, trainerState, pokemonStates, dispatch]);

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      <Button appearance="primary" onClick={handleCapture}>
        Capture Battle State
      </Button>
    </div>
  );
};
