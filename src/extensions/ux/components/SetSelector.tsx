import { ComboBox, DropdownMenuItemType, IComboBox, IComboBoxOption } from '@fluentui/react';
import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCpuSet, setPlayerSet } from '../store/setSlice';

export interface SetSelectorProps {
  /**
   * Which side of the battle this selector is for
   */
  side: 'player' | 'cpu';
}

/**
 * SetSelector component - renders a dropdown for selecting Pokemon sets
 * with species as group headers and set names as selectable options
 */
export const SetSelector: React.FC<SetSelectorProps> = ({ side }) => {
  const dispatch = useAppDispatch();
  
  // Select the appropriate state based on side
  const { selection, availableSets } = useAppSelector((state) => 
    side === 'player' ? state.set.player : state.set.cpu
  );

  // Convert PokemonSets to FluentUI combobox options format
  const options: IComboBoxOption[] = React.useMemo(() => {
    const opts: IComboBoxOption[] = [];
    
    Object.keys(availableSets)
      .sort() // Sort species alphabetically
      .forEach((species) => {
        // Add species as header
        opts.push({
          key: `header-${species}`,
          text: species.charAt(0).toUpperCase() + species.slice(1), // Capitalize
          itemType: DropdownMenuItemType.Header,
        });
        
        // Add each set under this species
        const sets = availableSets[species];
        Object.keys(sets).forEach((setName) => {
          opts.push({
            key: `${species}|${setName}`,
            text: `${species} (${setName})`,
            data: { species, setName }, // Store for easy access
          });
        });
      });
    
    return opts;
  }, [availableSets]);

  // Get selected key from current selection
  const selectedKey = React.useMemo(() => {
    if (selection.species && selection.setName) {
      return `${selection.species}|${selection.setName}`;
    }
    return undefined;
  }, [selection]);

  // Handle selection change
  const handleChange = React.useCallback(
    (_event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
      if (!option || option.itemType === DropdownMenuItemType.Header) {
        return;
      }

      const { species, setName } = option.data;
      const action = side === 'player' ? setPlayerSet : setCpuSet;
      
      dispatch(action({ species, setName }));
    },
    [side, dispatch]
  );

  return (
    <ComboBox
      placeholder="Select a Pokemon set"
      label={side === 'player' ? 'Player Set' : 'CPU Set'}
      options={options}
      selectedKey={selectedKey}
      onChange={handleChange}
      autoComplete="on"
      allowFreeform={false}
      styles={{
        root: { width: 300 },
      }}
    />
  );
};
