import { Label } from '@fluentui/react-components';
import * as React from 'react';
import { getPokemonId } from '../../../core/storage';
import { CustomSets } from '../../../core/storage.contracts';
import { PokemonCard } from './PokemonCard';

export interface TrainerBoxProps {
  /**
   * Available Pokemon sets
   */
  availableSets: CustomSets;

  /**
   * Array of Pokemon IDs currently in party (to exclude from box)
   */
  party: string[];

  /**
   * Currently selected Pokemon ID
   */
  selectedPokemonId?: string;

  /**
   * Callback when a Pokemon in the box is clicked
   */
  onPokemonClick: (species: string, setName: string) => void;
}

/**
 * TrainerBox component - displays all available Pokemon not in party in a grid
 */
export const TrainerBox: React.FC<TrainerBoxProps> = ({
  availableSets,
  party,
  selectedPokemonId,
  onPokemonClick,
}) => {
  // Build list of all Pokemon not in party
  const boxPokemon = React.useMemo(() => {
    const allPokemon: Array<{ id: string; species: string; setName: string }> = [];

    for (const species in availableSets) {
      const sets = availableSets[species];
      for (const setName in sets) {
        const pokemonId = getPokemonId(species, setName);
        if (!party.includes(pokemonId)) {
          allPokemon.push({ id: pokemonId, species, setName });
        }
      }
    }

    return allPokemon;
  }, [availableSets, party]);

  const containerStyle: React.CSSProperties = {
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 40px)',
    gap: '4px',
    marginTop: '8px',
  };

  return (
    <div style={containerStyle}>
      <Label weight="semibold" size="medium">
        Box ({boxPokemon.length} Pokemon)
      </Label>
      {boxPokemon.length === 0 ? (
        <div style={{ padding: '16px', color: 'var(--colorNeutralForeground3)', fontStyle: 'italic' }}>
          All Pokemon are in the party
        </div>
      ) : (
        <div style={gridStyle}>
          {boxPokemon.sort((a, b) => a.species.localeCompare(b.species)).map(({ id, species, setName }) => (
            <PokemonCard
              key={id}
              species={species}
              setName={setName}
              isSelected={id === selectedPokemonId}
              onClick={() => onPokemonClick(species, setName)}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  );
};
