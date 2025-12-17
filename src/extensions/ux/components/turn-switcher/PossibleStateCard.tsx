/**
 * Component to display a possible battle state outcome
 */

import { Card } from '@fluentui/react-components';
import * as React from 'react';
import { PossibleBattleFieldState } from '../../../simulator/turn-state';
import { useStyles } from './PossibleStateCard.styles';

export interface PossibleStateCardProps {
  /**
   * The possible state to display
   */
  possibleState: PossibleBattleFieldState;
  /**
   * Callback when the card is clicked
   */
  onSelect: () => void;
}

/**
 * Component that displays a single possible battle state outcome with probability
 */
export const PossibleStateCard: React.FC<PossibleStateCardProps> = ({
  possibleState,
  onSelect,
}) => {
  const styles = useStyles();
  const { probability, state } = possibleState;

  // Get HP information for display
  const playerPokemon = state.player.active[0]?.pokemon;
  const playerHp = playerPokemon?.curHP() || 0;
  const playerMaxHp = playerPokemon?.maxHP() || 1;
  const playerPokemonName = playerPokemon?.species.name || '';
  const cpuPokemon = state.cpu.active[0]?.pokemon;
  const cpuPokemonName = cpuPokemon?.species.name || '';
  const cpuHp = cpuPokemon?.curHP() || 0;
  const cpuMaxHp = cpuPokemon?.maxHP() || 1;

  const playerHpPercent = Math.round((playerHp / playerMaxHp) * 100);
  const cpuHpPercent = Math.round((cpuHp / cpuMaxHp) * 100);

  return (
    <Card
      className={styles.card}
      appearance="subtle"
      onClick={onSelect}
    >
      <div className={styles.cardContent}>
        <div className={styles.probability}>
          {(probability * 100).toFixed(1)}%
        </div>
        <div className={styles.hpInfo}>
          <div className={styles.hpRow}>
            <span className={styles.label}>Player:</span>
            <span className={styles.hpValue}>{playerPokemonName} {playerHpPercent}%</span>
          </div>
          <div className={styles.hpRow}>
            <span className={styles.label}>CPU:</span>
            <span className={styles.hpValue}>{cpuPokemonName} {cpuHpPercent}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
