import { DropdownMenuItemType, IComboBox, IComboBoxOption, VirtualizedComboBox } from '@fluentui/react';
import * as React from 'react';
import { PokemonSets, SetSelection } from '../store/setSlice';

export interface SetSelectorProps {
  /**
   * Label for the selector
   */
  label: string;
  /**
   * Current selection
   */
  selection: SetSelection;
  /**
   * Available sets to choose from
   */
  availableSets: PokemonSets;
  /**
   * Callback when selection changes
   */
  onSelectionChange: (selection: SetSelection) => void;
  /**
   * Whether to show "Blank Set" option for each species
   */
  showBlankOption?: boolean;
}

/**
 * SetSelector component - renders a dropdown for selecting Pokemon sets
 * with species as group headers and set names as selectable options
 */
export const SetSelector: React.FC<SetSelectorProps> = ({ 
  label,
  selection,
  availableSets,
  onSelectionChange,
  showBlankOption = false,
}) => {

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
        const setNames = Object.keys(sets);
        setNames.sort();
        if (showBlankOption)
          setNames.push('Blank Set');
        setNames.forEach((setName) => {
          opts.push({
            key: `${species}|${setName}`,
            text: `${species} (${setName})`,
            data: { species, setName }, // Store for easy access
          });
        });
      });
    
    return opts;
  }, [availableSets, showBlankOption]);

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
      onSelectionChange({ species, setName });
    },
    [onSelectionChange]
  );

  return (
    <VirtualizedComboBox
      placeholder="Select a Pokemon set"
      label={label}
      options={options}
      selectedKey={selectedKey}
      onChange={handleChange}
      autoComplete="on"
      allowFreeform={true}
      dropdownMaxWidth={400}
      useComboBoxAsMenuWidth
      styles={{
        root: { width: 300 },
      }}
    />
  );
};
