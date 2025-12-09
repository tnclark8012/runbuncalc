/**
 * Styles for TrainerParty component
 */

import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  },
  containerOverLimit: {
    border: `2px solid ${tokens.colorPaletteRedBorder1}`,
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  },
  partyRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    minHeight: '45px',
  },
  overLimitText: {
    color: tokens.colorPaletteRedForeground1,
  },
  emptyState: {
    color: 'var(--colorNeutralForeground3)',
    fontStyle: 'italic',
  },
});
