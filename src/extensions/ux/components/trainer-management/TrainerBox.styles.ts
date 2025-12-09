/**
 * Styles for TrainerBox component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 40px)',
    gap: '4px',
    marginTop: '8px',
  },
  emptyState: {
    padding: '16px',
    color: 'var(--colorNeutralForeground3)',
    fontStyle: 'italic',
  },
});
