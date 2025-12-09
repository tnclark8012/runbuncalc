/**
 * Styles for PokemonCard component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  cardSmall: {
    width: '40px',
    height: '30px',
    padding: '0',
    cursor: 'pointer',
    border: '1px solid var(--colorNeutralStroke1)',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardSmallSelected: {
    width: '40px',
    height: '30px',
    padding: '0',
    cursor: 'pointer',
    border: '2px solid var(--colorBrandBackground)',
    boxShadow: '0 0 4px var(--colorBrandBackground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardMedium: {
    width: '60px',
    height: '45px',
    padding: '0',
    cursor: 'pointer',
    border: '1px solid var(--colorNeutralStroke1)',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardMediumSelected: {
    width: '60px',
    height: '45px',
    padding: '0',
    cursor: 'pointer',
    border: '2px solid var(--colorBrandBackground)',
    boxShadow: '0 0 4px var(--colorBrandBackground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});
