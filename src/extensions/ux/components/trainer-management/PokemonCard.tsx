import { Avatar, Card, Tooltip } from '@fluentui/react-components';
import * as React from 'react';
import { useStyles } from './PokemonCard.styles';

export interface PokemonCardProps {
  /**
   * Pokemon species name (e.g., "Pikachu")
   */
  species: string;

  /**
   * Set name (e.g., "Ace Trainer Sarah")
   */
  setName: string;

  /**
   * Whether this Pokemon is currently selected
   */
  isSelected: boolean;

  /**
   * Callback when the card is clicked
   */
  onClick: () => void;

  /**
   * Size of the card
   * - small: 40x30px (for box)
   * - medium: 60x45px (for party)
   */
  size?: 'small' | 'medium';

  /**
   * Whether this Pokemon is fainted (currentHp = 0)
   */
  isFainted?: boolean;
}

/**
 * PokemonCard component - displays a Pokemon sprite with fallback to Avatar
 */
export const PokemonCard: React.FC<PokemonCardProps> = ({
  species,
  setName,
  isSelected,
  onClick,
  size = 'small',
  isFainted = false,
}) => {
  const styles = useStyles();
  const [imageError, setImageError] = React.useState(false);

  const imageUrl = `https://raw.githubusercontent.com/May8th1995/sprites/master/${species}.png`;

  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);

  // Reset image error when species changes
  React.useEffect(() => {
    setImageError(false);
  }, [species]);

  // Determine card style based on size, selection state, and fainted status
  const getCardClassName = () => {
    if (size === 'small') {
      if (isFainted) {
        return isSelected ? styles.cardSmallSelectedFainted : styles.cardSmallFainted;
      }
      return isSelected ? styles.cardSmallSelected : styles.cardSmall;
    }
    if (isFainted) {
      return isSelected ? styles.cardMediumSelectedFainted : styles.cardMediumFainted;
    }
    return isSelected ? styles.cardMediumSelected : styles.cardMedium;
  };

  const content = imageError ? (
    <Avatar
      name={species}
      size={size === 'small' ? 24 : 36}
      style={{ fontSize: size === 'small' ? '12px' : '16px' }}
    />
  ) : (
    <img
      src={imageUrl}
      alt={species}
      loading="lazy"
      onError={handleImageError}
      className={styles.image}
    />
  );

  return (
    <Tooltip content={`${species} (${setName})`} relationship="label">
      <Card
        onClick={onClick}
        className={getCardClassName()}
        appearance="subtle"
      >
        {content}
      </Card>
    </Tooltip>
  );
};
