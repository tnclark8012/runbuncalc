/**
 * Styles for CaptureBattleState component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    margin: '20px 0',
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  possibleStatesContainer: {
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '12px',
    marginTop: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
  },
  possibleStatesRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
});
