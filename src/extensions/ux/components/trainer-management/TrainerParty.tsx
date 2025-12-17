import { Label } from '@fluentui/react-components';
import * as React from 'react';
import { CustomSets } from '../../../core/storage.contracts';
import { parsePokemonId } from '../../party';
import { useAppSelector } from '../../store/hooks';
import { PokemonCard } from './PokemonCard';
import { useStyles } from './TrainerParty.styles';

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

  /**
   * Which side this party belongs to ('player' or 'cpu')
   */
  side: 'player' | 'cpu';
}

/**
 * TrainerParty component - displays the trainer's party Pokemon in a horizontal row
 */
export const TrainerParty: React.FC<TrainerPartyProps> = ({
  party,
  availableSets,
  selectedPokemonId,
  onPokemonClick,
  side,
}) => {
  const styles = useStyles();
  const isOverLimit = party.length > 6;
  const pokemonStates = useAppSelector((state) => state.pokemonState[side]);

  return (
    <div className={isOverLimit ? styles.containerOverLimit : styles.container}>
      <Label weight="semibold" size="medium">
        Party {isOverLimit && <span className={styles.overLimitText}>({party.length}/6 - Over Limit!)</span>}
      </Label>
      <div className={styles.partyRow}>
        {party.length === 0 ? (
          <span className={styles.emptyState}>
            No Pokemon in party
          </span>
        ) : (
          [...party].map((pokemonId) => {
            const parsed = parsePokemonId(pokemonId);
            if (!parsed) return null;

            const { species, setName } = parsed;
            const isSelected = pokemonId === selectedPokemonId;
            const pokemonState = pokemonStates[pokemonId];
            const isFainted = pokemonState?.currentHp === 0;

            return (
              <PokemonCard
                key={pokemonId}
                species={species}
                setName={setName}
                isSelected={isSelected}
                onClick={() => onPokemonClick(species, setName)}
                size="medium"
                isFainted={isFainted}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
