/**
 * Initialize the PokemonSetDetails components for player and CPU
 */

import * as React from 'react';
import { useAppSelector } from '../store/hooks';
import { PokemonSetDetails } from './PokemonSetDetails';

/**
 * Connected wrapper component for Player PokemonSetDetails
 */
export const PlayerPokemonSetDetails: React.FC = () => {
  const { selection, availableSets } = useAppSelector((state) => state.set.player);

  // Get the selected Pokemon species and set based on current selection
  const speciesSet = React.useMemo(() => {
    if (selection.species && selection.setName) {
      const set = availableSets[selection.species]?.[selection.setName];
      if (set) {
        return { species: selection.species, set };
      }
    }
    return undefined;
  }, [selection, availableSets]);

  return (
    <PokemonSetDetails
      label="Player Set Details"
      speciesSet={speciesSet}
    />
  );
};

/**
 * Connected wrapper component for CPU PokemonSetDetails
 */
export const CpuPokemonSetDetails: React.FC = () => {
  const { selection, availableSets } = useAppSelector((state) => state.set.cpu);

  // Get the selected Pokemon species and set based on current selection
  const speciesSet = React.useMemo(() => {
    if (selection.species && selection.setName) {
      const set = availableSets[selection.species]?.[selection.setName];
      if (set) {
        return { species: selection.species, set };
      }
    }
    return undefined;
  }, [selection, availableSets]);

  return (
    <PokemonSetDetails
      label="CPU Set Details"
      speciesSet={speciesSet}
      readonly={true}
    />
  );
};
