/**
 * Styles for TurnSwitcher component
 */

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '4px',
    padding: '8px',
    marginTop: '10px',
  },
  statesRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    minHeight: '60px',
    overflowX: 'auto',
  },
  emptyState: {
    color: 'var(--colorNeutralForeground3)',
    fontStyle: 'italic',
  },
  stateCard: {
    minWidth: '80px',
    cursor: 'pointer',
    padding: '8px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  stateCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderColor(tokens.colorBrandStroke1),
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  turnNumber: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: tokens.colorBrandForeground1,
  },
  moveText: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '70px',
  },
});
