/**
 * Styles for PossibleStateCard component
 */

import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  card: {
    minWidth: '120px',
    cursor: 'pointer',
    padding: '12px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  probability: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: tokens.colorBrandForeground1,
    textAlign: 'center',
  },
  hpInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hpRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  label: {
    color: 'var(--colorNeutralForeground2)',
  },
  hpValue: {
    fontWeight: 'semibold',
    color: 'var(--colorNeutralForeground1)',
  },
});
