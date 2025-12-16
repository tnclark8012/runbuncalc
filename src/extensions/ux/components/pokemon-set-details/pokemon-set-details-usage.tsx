/**
 * Initialize the PokemonSetDetails components for player and CPU
 */

import * as React from 'react';
import { getPokemonId } from '../../../core/storage';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { PokemonState, setCpuPokemonState, setPlayerPokemonState } from '../../store/pokemonStateSlice';
import { selectBattleFieldState } from '../../store/selectors/battleFieldStateSelector';
import { PokemonSetDetails, SpeciesSet } from './PokemonSetDetails';
import { toSpeciesSet } from './pokemon-set-details.utils';

/**
 * Connected wrapper component for Player PokemonSetDetails
 */
export const PlayerPokemonSetDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection } = useAppSelector((state) => state.set.player);
  const battleFieldState = useAppSelector(selectBattleFieldState);

  // Get the selected Pokemon species and set based on current selection
  const baseSpeciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!selection || !battleFieldState) return;

    const pokemon = battleFieldState.player.active.find(p => p.pokemon.species.name === selection.species)?.pokemon || battleFieldState.player.party.find(p => p.species.name === selection.species);

    if (!pokemon) {
      console.warn(`Player active or party does not contain selected species: ${selection.species}`);
      return;
    }

    return toSpeciesSet(pokemon);
  }, [selection, battleFieldState]);

    // Get Pokemon ID for state lookup
  const pokemonId = React.useMemo(() => {
    if (selection && baseSpeciesSet) {
      return getPokemonId(baseSpeciesSet.species, selection.setName);
    }

    return;
  }, [baseSpeciesSet, selection]);

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
    speciesSet && battleFieldState &&
    <PokemonSetDetails
      label="Player Set Details"
      speciesSet={speciesSet}
      field={battleFieldState.playerField}
      side={battleFieldState.playerSide}
      onStateChange={handleStateChange}
    />
  );
};

/**
 * Connected wrapper component for CPU PokemonSetDetails
 */
export const CpuPokemonSetDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection } = useAppSelector((state) => state.set.cpu);
  const battleFieldState = useAppSelector(selectBattleFieldState);

 // Get the selected Pokemon species and set based on current selection
  const baseSpeciesSet: SpeciesSet | undefined = React.useMemo(() => {
    if (!selection || !battleFieldState) return;

    const pokemon = battleFieldState.cpu.active.find(p => p.pokemon.species.name === selection.species)?.pokemon || battleFieldState.cpu.party.find(p => p.species.name === selection.species);

    if (!pokemon) {
      console.warn(`CPU active or party does not contain selected species: ${selection.species}`);
      return;
    }

    return toSpeciesSet(pokemon);
  }, [selection, battleFieldState]);

    // Get Pokemon ID for state lookup
  const pokemonId = React.useMemo(() => {
    if (!baseSpeciesSet || !selection) return;

    return getPokemonId(baseSpeciesSet.species, selection.setName);
  }, [baseSpeciesSet, selection]);

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
    speciesSet && battleFieldState &&
    <PokemonSetDetails
      label="CPU Set Details"
      speciesSet={speciesSet}
      field={battleFieldState.cpuField}
      side={battleFieldState.cpuSide}
      onStateChange={handleStateChange}
      readonly={true}
    />
  );
};
