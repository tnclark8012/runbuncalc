/**
 * Connected container components for TrainerParty and TrainerBox
 */

import { Button } from '@fluentui/react-components';
import { Add20Regular, ChevronLeft20Regular, ChevronRight20Regular, Subtract20Regular } from '@fluentui/react-icons';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { getPokemonId } from '../../../core/storage';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../../../trainer-sets';
import { useAppDispatch } from '../../store/hooks';
import { demoteToBox, promoteToParty } from '../../store/partySlice';
import { clearCpuStates } from '../../store/pokemonStateSlice';
import { setCpuSet, setPlayerSet } from '../../store/setSlice';
import { RootState } from '../../store/store';
import { loadTrainerByIndex } from '../../store/trainerSlice';
import { TrainerBox } from './TrainerBox';
import { TrainerParty } from './TrainerParty';

/**
 * PlayerPartyManager - manages player party with promote/demote button
 */
export const PlayerPartyManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playerParty } = useSelector((state: RootState) => state.party);
  const { selection, availableSets } = useSelector((state: RootState) => state.set.player);

  // Get current selected Pokemon ID
  const selectedPokemonId = React.useMemo(() => {
    if (selection!.species && selection!.setName) {
      return getPokemonId(selection!.species, selection!.setName);
    }
    return undefined;
  }, [selection]);

  // Determine if selected Pokemon is in party or box
  const isSelectedInParty = selectedPokemonId ? playerParty.includes(selectedPokemonId) : false;
  const isSelectedInBox = selectedPokemonId && !isSelectedInParty;

  const handlePokemonClick = React.useCallback(
    (species: string, setName: string) => {
      dispatch(setPlayerSet({ species, setName }));
    },
    [dispatch]
  );

  const handlePromoteClick = React.useCallback(() => {
    if (selectedPokemonId && isSelectedInBox) {
      dispatch(promoteToParty(selectedPokemonId));
    }
  }, [dispatch, selectedPokemonId, isSelectedInBox]);

  const handleDemoteClick = React.useCallback(() => {
    if (selectedPokemonId && isSelectedInParty) {
      dispatch(demoteToBox(selectedPokemonId));
    }
  }, [dispatch, selectedPokemonId, isSelectedInParty]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  };

  return (
    <div style={containerStyle}>
      <div style={{ paddingTop: '10px' }}>
        {isSelectedInBox && (
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            onClick={handlePromoteClick}
            title="Promote to Party"
            aria-label="Promote to Party"
            style={{ backgroundColor: 'green' }}
          />
        )}
        {isSelectedInParty && (
          <Button
            appearance="primary"
            icon={<Subtract20Regular />}
            onClick={handleDemoteClick}
            title="Demote to Box"
            aria-label="Demote to Box"
            style={{ backgroundColor: 'red' }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <TrainerParty
          party={playerParty}
          availableSets={availableSets}
          selectedPokemonId={selectedPokemonId}
          onPokemonClick={handlePokemonClick}
        />
      </div>
    </div>
  );
};

/**
 * CpuPartyManager - displays CPU trainer's party with navigation buttons
 */
export const CpuPartyManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection, availableSets } = useSelector((state: RootState) => state.set.cpu);
  const { currentTrainerIndex } = useSelector((state: RootState) => state.trainer);

  // Build party from current trainer's Pokemon
  const cpuParty = React.useMemo(() => {
    const trainerName = getTrainerNameByTrainerIndex(currentTrainerIndex);
    const trainerParty = OpposingTrainer(trainerName);
    return trainerParty.map(p => getPokemonId(p.species.name, trainerName));
  }, [availableSets, currentTrainerIndex]);

  const selectedPokemonId = React.useMemo(() => {
    if (selection!.species && selection!.setName) {
      return getPokemonId(selection!.species, selection!.setName);
    }
    return undefined;
  }, [selection]);

  const handlePokemonClick = React.useCallback(
    (species: string, setName: string) => {
      dispatch(setCpuSet({ species, setName }));
    },
    [dispatch]
  );

  // Clear CPU Pokemon states when trainer changes
  React.useEffect(() => {
    dispatch(clearCpuStates());
  }, [currentTrainerIndex, dispatch]);

  const updateTrainerIndex = (newIndex: number) => {
    if (newIndex > 0)
      dispatch(loadTrainerByIndex(newIndex));

    const trainerName = getTrainerNameByTrainerIndex(newIndex);
    const trainerParty = OpposingTrainer(trainerName);
    const fistMon = trainerParty[0];
    dispatch(setCpuSet({ species: fistMon.species.name, setName: trainerName }));
  };

  const handlePreviousTrainer = React.useCallback(() => {
    updateTrainerIndex(currentTrainerIndex - 1);
  }, [dispatch, currentTrainerIndex]);

  const handleNextTrainer = React.useCallback(() => {
    updateTrainerIndex(currentTrainerIndex + 1);
  }, [dispatch, currentTrainerIndex]);

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    justifyContent: 'center',
  };

  return (
    <div>
      <TrainerParty
        party={cpuParty}
        availableSets={availableSets}
        selectedPokemonId={selectedPokemonId}
        onPokemonClick={handlePokemonClick}
      />
      <div style={buttonContainerStyle}>
        <Button
          appearance="secondary"
          icon={<ChevronLeft20Regular />}
          onClick={handlePreviousTrainer}
          disabled={currentTrainerIndex === 0}
        >
          Previous Trainer
        </Button>
        <Button
          appearance="secondary"
          icon={<ChevronRight20Regular />}
          onClick={handleNextTrainer}
        >
          Next Trainer
        </Button>
      </div>
    </div>
  );
};

/**
 * PlayerBoxManager - displays player's box (Pokemon not in party)
 */
export const PlayerBoxManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playerParty } = useSelector((state: RootState) => state.party);
  const { selection, availableSets } = useSelector((state: RootState) => state.set.player);

  const selectedPokemonId = React.useMemo(() => {
    if (selection!.species && selection!.setName) {
      return getPokemonId(selection!.species, selection!.setName);
    }
    return undefined;
  }, [selection]);

  const handlePokemonClick = React.useCallback(
    (species: string, setName: string) => {
      dispatch(setPlayerSet({ species, setName }));
    },
    [dispatch]
  );

  return (
    <TrainerBox
      availableSets={availableSets}
      party={playerParty}
      selectedPokemonId={selectedPokemonId}
      onPokemonClick={handlePokemonClick}
    />
  );
};
