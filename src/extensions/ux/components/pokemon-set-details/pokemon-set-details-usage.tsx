/**
 * Initialize the PokemonSetDetails components for player and CPU
 */

import * as React from 'react';
import { getPokemonId } from '../../../core/storage';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { PokemonState, setCpuPokemonState, setPlayerPokemonState } from '../../store/pokemonStateSlice';
import { PokemonSetDetails, SpeciesSet } from './PokemonSetDetails';

/**
 * Connected wrapper component for Player PokemonSetDetails
 */
export const PlayerPokemonSetDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection, availableSets } = useAppSelector((state) => state.set.player);

  // Get the selected Pokemon species and set based on current selection
  const baseSpeciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!selection) return;

      const set = availableSets[selection.species]?.[selection.setName];
      if (set) {
        return { species: selection.species, set, setName: selection.setName };
      }

    return undefined;
  }, [selection, availableSets]);

    // Get Pokemon ID for state lookup
  const pokemonId = React.useMemo(() => {
    if (baseSpeciesSet) {
      return getPokemonId(baseSpeciesSet.species, baseSpeciesSet.setName || 'Unknown');
    }
    return undefined;
  }, [baseSpeciesSet]);

  const pokemonState = useAppSelector((state) => state.pokemonState.player[pokemonId!]);

  // Get Pokemon state from Redux
  const speciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!baseSpeciesSet) return undefined;
    return { ...baseSpeciesSet, state: pokemonState };
  }, [baseSpeciesSet, pokemonState]);

  // Handler to update Pokemon state
  const handleStateChange = React.useCallback((updates: Partial<PokemonState>) => {
    if (!pokemonId) return;
    const newState = { ...speciesSet?.state, ...updates };
    dispatch(setPlayerPokemonState({ pokemonId, state: newState }));
  }, [dispatch, pokemonId, speciesSet]);

  return (
    <PokemonSetDetails
      label="Player Set Details"
      speciesSet={speciesSet}
      onStateChange={handleStateChange}
    />
  );
};

/**
 * Connected wrapper component for CPU PokemonSetDetails
 */
export const CpuPokemonSetDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection, availableSets } = useAppSelector((state) => state.set.cpu);

 // Get the selected Pokemon species and set based on current selection
  const baseSpeciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!selection) return;

      const set = availableSets[selection.species]?.[selection.setName];
      if (set) {
        return { species: selection.species, set, setName: selection.setName };
      }

    return undefined;
  }, [selection, availableSets]);

    // Get Pokemon ID for state lookup
  const pokemonId = React.useMemo(() => {
    if (baseSpeciesSet) {
      return getPokemonId(baseSpeciesSet.species, baseSpeciesSet.setName || 'Unknown');
    }
    return undefined;
  }, [baseSpeciesSet]);

  const pokemonState = useAppSelector((state) => state.pokemonState.cpu[pokemonId!]);

  // Get Pokemon state from Redux
  const speciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!baseSpeciesSet) return undefined;
    return { ...baseSpeciesSet, state: pokemonState };
  }, [baseSpeciesSet, pokemonState]);

  // Handler to update Pokemon state
  const handleStateChange = React.useCallback((updates: Partial<PokemonState>) => {
    if (!pokemonId) return;
    const newState = { ...speciesSet?.state, ...updates };
    dispatch(setCpuPokemonState({ pokemonId, state: newState }));
  }, [dispatch, pokemonId, speciesSet]);

  return (
    <PokemonSetDetails
      label="CPU Set Details"
      speciesSet={speciesSet}
      onStateChange={handleStateChange}
      readonly={true}
    />
  );
};
