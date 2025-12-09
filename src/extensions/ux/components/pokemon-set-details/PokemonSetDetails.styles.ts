/**
 * Styles for PokemonSetDetails component
 */

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    padding: '10px',
  },
  controlRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  controlLabel: {
    minWidth: '60px',
  },
  typeDropdown: {
    width: '100px',
    minWidth: '100px',
  },
  type2Dropdown: {
    width: '100px',
    minWidth: '100px',
  },
  type2Hidden: {
    width: '100px',
    minWidth: '100px',
    visibility: 'hidden',
  },
  formDropdownContainer: {
    width: '250px',
  },
  formDropdownVisible: {
    width: '250px',
  },
  formDropdownHidden: {
    width: '250px',
  },
  levelInput: {
    width: '80px',
  },
  table: {
    marginTop: '10px',
  },
  ivInput: {
    width: '80px',
  },
  boostDropdown: {
    width: '60px',
    minWidth: '60px',
  },
  wideDropdown: {
    width: '250px',
  },
});
