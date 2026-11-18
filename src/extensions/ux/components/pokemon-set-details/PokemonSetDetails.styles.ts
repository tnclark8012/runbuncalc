/**
 * Styles for PokemonSetDetails component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    padding: '10px',
    minWidth: 0,
    '@media (max-width: 799px)': {
      padding: '4px 0',
    },
  },
  controlRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    '@media (max-width: 799px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '4px',
    },
  },
  typeRow: {
    '@media (max-width: 799px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      '& label': {
        gridColumn: '1 / -1',
      },
    },
  },
  hiddenFormRow: {
    visibility: 'hidden',
    '@media (max-width: 799px)': {
      display: 'none',
    },
  },
  controlLabel: {
    minWidth: '60px',
    flexShrink: 0,
  },
  typeDropdown: {
    width: '100px',
    minWidth: '100px',
    '@media (max-width: 799px)': {
      width: '100%',
      minWidth: 0,
    },
  },
  type2Dropdown: {
    width: '100px',
    minWidth: '100px',
    '@media (max-width: 799px)': {
      width: '100%',
      minWidth: 0,
    },
  },
  type2Hidden: {
    width: '100px',
    minWidth: '100px',
    visibility: 'hidden',
    '@media (max-width: 799px)': {
      width: '100%',
      minWidth: 0,
    },
  },
  formDropdownContainer: {
    width: '250px',
    minWidth: 0,
    maxWidth: '100%',
  },
  levelInput: {
    width: '80px',
  },
  table: {
    marginTop: '10px',
    tableLayout: 'fixed',
    width: '100%',
    '& th, & td': {
      paddingLeft: '4px',
      paddingRight: '4px',
    },
    '@media (max-width: 799px)': {
      fontSize: '12px',
      '& th, & td': {
        paddingLeft: '1px',
        paddingRight: '1px',
        overflowWrap: 'anywhere',
      },
    },
  },
  ivInput: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    '@media (max-width: 799px)': {
      paddingLeft: '2px',
      paddingRight: '2px',
      '& input': {
        fontSize: '12px',
        padding: '0 2px',
      },
    },
  },
  fullStatLabel: {
    '@media (max-width: 799px)': {
      display: 'none',
    },
  },
  shortStatLabel: {
    display: 'none',
    '@media (max-width: 799px)': {
      display: 'inline',
    },
  },
  boostDropdown: {
    width: '60px',
    minWidth: '60px',
    '@media (max-width: 799px)': {
      width: '100%',
      minWidth: 0,
      '& button': {
        paddingLeft: '2px',
        paddingRight: '2px',
        fontSize: '12px',
        columnGap: 0,
      },
    },
  },
  wideDropdown: {
    width: '250px',
    minWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
  },
});
