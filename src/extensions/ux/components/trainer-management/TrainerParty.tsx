import { Label } from '@fluentui/react-components';
import * as React from 'react';
import { CustomSets } from '../../../core/storage.contracts';
import { PokemonCard } from './PokemonCard';

export interface TrainerPartyProps {
  /**
   * Array of Pokemon IDs in format "species (setName)"
   */
  party: string[];

  /**
   * Available Pokemon sets to lookup species/set data
   */
  availableSets: CustomSets;

  /**
   * Currently selected Pokemon ID
   */
  selectedPokemonId?: string;

  /**
   * Callback when a Pokemon in the party is clicked
   */
  onPokemonClick: (species: string, setName: string) => void;
}

/**
 * Helper to parse Pokemon ID in format "species (setName)"
 */
function parsePokemonId(pokemonId: string): { species: string; setName: string } | null {
  const match = /^(.+) \((.+)\)$/.exec(pokemonId);
  if (!match) return null;
  return { species: match[1], setName: match[2] };
}

/**
 * TrainerParty component - displays the trainer's party Pokemon in a horizontal row
 */
export const TrainerParty: React.FC<TrainerPartyProps> = ({
  party,
  availableSets,
  selectedPokemonId,
  onPokemonClick,
}) => {
  const isOverLimit = party.length > 6;

  const containerStyle: React.CSSProperties = {
    border: isOverLimit ? '2px solid red' : '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  };

  const partyRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    minHeight: '45px',
  };

  return (
    <div style={containerStyle}>
      <Label weight="semibold" size="medium">
        Party {isOverLimit && <span style={{ color: 'red' }}>({party.length}/6 - Over Limit!)</span>}
      </Label>
      <div style={partyRowStyle}>
        {party.length === 0 ? (
          <span style={{ color: 'var(--colorNeutralForeground3)', fontStyle: 'italic' }}>
            No Pokemon in party
          </span>
        ) : (
          [...party].map((pokemonId) => {
            const parsed = parsePokemonId(pokemonId);
            if (!parsed) return null;

            const { species, setName } = parsed;
            const isSelected = pokemonId === selectedPokemonId;

            return (
              <PokemonCard
                key={pokemonId}
                species={species}
                setName={setName}
                isSelected={isSelected}
                onClick={() => onPokemonClick(species, setName)}
                size="medium"
              />
            );
          })
        )}
      </div>
    </div>
  );
};
