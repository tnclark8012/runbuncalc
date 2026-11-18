/**
 * Styles for HPBar component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    marginTop: '10px',
  },
  inputRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '5px',
    '@media (max-width: 799px)': {
      gap: '4px',
      fontSize: '12px',
    },
  },
  label: {
    minWidth: '60px',
    '@media (max-width: 799px)': {
      flexBasis: '100%',
    },
  },
  hpInput: {
    width: '68px',
    minWidth: 0,
    '@media (max-width: 799px)': {
      width: '48px',
      paddingLeft: '2px',
      paddingRight: '2px',
      '& input': {
        fontSize: '12px',
        padding: '0 2px',
      },
    },
  },
  healthBarContainer: {
    width: 'calc(100% - 70px)',
    height: '8px',
    backgroundColor: '#333',
    border: '1px solid #666',
    borderRadius: '4px',
    overflow: 'hidden',
    marginLeft: '70px',
    maxWidth: '300px',
    '@media (max-width: 799px)': {
      width: '100%',
      marginLeft: 0,
      boxSizing: 'border-box',
    },
  },
  healthBar: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
});
