/**
 * Component for capturing the current battle state
 */

import { Button, Label } from '@fluentui/react-components';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertBattleFieldStateToRedux } from '../battleFieldStateConverter';
import { usePossibleStates } from '../hooks/usePossibleStates';
import { captureBattleState, clearCapturedStates, PlannedTrainerActionState, selectCapturedState, setCurrentTurnNumber } from '../store/capturedBattleStateSlice';
import { loadFieldState } from '../store/fieldSlice';
import { loadPlayerParty } from '../store/partySlice';
import { clearCpuStates, clearPlayerStates, setCpuPokemonStates, setPlayerPokemonStates } from '../store/pokemonStateSlice';
import { selectBattleFieldState } from '../store/selectors/battleFieldStateSelector';
import { RootState } from '../store/store';
import { useStyles } from './CaptureBattleState.styles';
import { PossibleStateCard } from './turn-switcher/PossibleStateCard';
import { TurnSwitcher } from './turn-switcher/TurnSwitcher';

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
  const capturedStates = useSelector((state: RootState) => state.capturedBattleState.capturedStates);
  const selectedStateIndex = useSelector((state: RootState) => state.capturedBattleState.selectedStateIndex);

  const possibleStates = usePossibleStates();

  const handleSelectState = React.useCallback((index: number) => {
    dispatch(selectCapturedState(index));
  }, [dispatch]);

  const handleSelectPossibleState = React.useCallback((index: number) => {
    const possibleState = possibleStates[index];
    if (!possibleState) return;

    const converted = convertBattleFieldStateToRedux(possibleState.state);
    
    // Load the state into Redux
    dispatch(loadPlayerParty(converted.party.playerParty));
    dispatch(setPlayerPokemonStates(converted.pokemonStates.player));
    dispatch(setCpuPokemonStates(converted.pokemonStates.cpu));
    dispatch(loadFieldState(converted.fieldState));
    dispatch(setCurrentTurnNumber(converted.turnNumber + 1));
    
    // Clear selection after loading
    dispatch(selectCapturedState(null));
  }, [dispatch, possibleStates]);

  const handleCapture = React.useCallback(() => {
    if (!battleState) {
      console.warn('Cannot capture battle state: Missing required selections');
      return;
    }

    // Get the selected move name directly from the store
    let plannedPlayerAction: PlannedTrainerActionState | undefined;
    
    const previousTurn = capturedStates.find(t => t.turnNumber === currentTurnNumber - 1);
    if (previousTurn && previousTurn.plannedPlayerAction &&
        previousTurn.plannedPlayerAction.type === 'move' &&
          previousTurn.plannedPlayerAction.pokemonSpecies !== battleState.player.active[0].pokemon.species.name
      ) {
        plannedPlayerAction = {
          type: 'switch',
          pokemonSpecies: battleState.player.active[0].pokemon.species.name,
      }
    }
    else if (selectedMoveName) {
      const playerPokemon = battleState.player.active[0].pokemon;
      plannedPlayerAction = {
        type: 'move',
        pokemonSpecies: playerPokemon.species.name,
        move: selectedMoveName,
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
  }, [battleState, selectedMoveName, partyState, trainerIndex, pokemonStates, fieldState, currentTurnNumber, capturedStates, dispatch]);

  const handleClear = React.useCallback(() => {
    dispatch(clearCapturedStates());
    dispatch(clearCpuStates());
    dispatch(clearPlayerStates());
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
      <TurnSwitcher 
        capturedStates={capturedStates} 
        selectedStateIndex={selectedStateIndex}
        onSelectState={handleSelectState}
      />
      {possibleStates.length > 0 && (
        <div className={styles.possibleStatesContainer}>
          <Label weight="semibold" size="medium" style={{ marginBottom: '8px' }}>
            Possible Next States ({possibleStates.length})
          </Label>
          <div className={styles.possibleStatesRow}>
            {possibleStates.map((possibleState, index) => (
              <PossibleStateCard
                key={index}
                possibleState={possibleState}
                onSelect={() => handleSelectPossibleState(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
