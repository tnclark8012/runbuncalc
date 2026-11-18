/**
 * Styles for MoveResultGroup component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  moveLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    '@media (max-width: 799px)': {
      flexDirection: 'column',
      fontSize: '12px',
    },
  },
  damagePercent: {
    marginLeft: '1rem',
    '@media (max-width: 799px)': {
      marginLeft: 0,
    },
  },
  moveRadio: {
    minWidth: 0,
    '& label': {
      minWidth: 0,
    },
    '@media (max-width: 799px)': {
      minHeight: '52px',
      '& label': {
        paddingLeft: '2px',
        paddingRight: '2px',
      },
    },
  },
  fasterContainer: {
    border: '2px solid #0078d4',
    borderRadius: '4px',
    padding: '8px',
    '@media (max-width: 799px)': {
      padding: '4px',
    },
  },
});
