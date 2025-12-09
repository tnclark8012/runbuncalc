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
    gap: '10px',
    alignItems: 'center',
    marginBottom: '5px',
  },
  label: {
    minWidth: '60px',
  },
  hpInput: {
    width: '68px',
  },
  healthBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#333',
    border: '1px solid #666',
    borderRadius: '4px',
    overflow: 'hidden',
    marginLeft: '70px',
    maxWidth: '300px',
  },
  healthBar: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
});
