import { Avatar, Card, Tooltip } from '@fluentui/react-components';
import * as React from 'react';

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
}) => {
  const [imageError, setImageError] = React.useState(false);

  const dimensions = size === 'small' ? { width: 40, height: 30 } : { width: 60, height: 45 };
  const imageUrl = `https://raw.githubusercontent.com/May8th1995/sprites/master/${species}.png`;

  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);

  // Reset image error when species changes
  React.useEffect(() => {
    setImageError(false);
  }, [species]);

  const cardStyle: React.CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    padding: 0,
    cursor: 'pointer',
    border: isSelected ? '2px solid var(--colorBrandBackground)' : '1px solid var(--colorNeutralStroke1)',
    boxShadow: isSelected ? '0 0 4px var(--colorBrandBackground)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );

  return (
    <Tooltip content={`${species} (${setName})`} relationship="label">
      <Card
        onClick={onClick}
        style={cardStyle}
        appearance="subtle"
      >
        {content}
      </Card>
    </Tooltip>
  );
};
