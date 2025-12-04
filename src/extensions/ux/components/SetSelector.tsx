import { Combobox, ComboboxProps, Option, OptionGroup, OptionOnSelectData, SelectionEvents } from '@fluentui/react-components';
import * as React from 'react';
import { CustomSets } from '../../core/storage.contracts';
import { SetSelection } from '../store/setSlice';

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
  availableSets: CustomSets;
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
 * SetSelector component - renders a combobox for selecting Pokemon sets
 * with species as group headers and set names as selectable options
 */
export const SetSelector: React.FC<SetSelectorProps> = ({ 
  label,
  selection,
  availableSets,
  onSelectionChange,
  showBlankOption = false,
}) => {
  // Get display value for selected item
  const selectedValue = React.useMemo(() => {
    if (selection.species && selection.setName) {
      return `${selection.species} (${selection.setName})`;
    }
    return '';
  }, [selection]);

  // Handle selection change
  const handleOptionSelect: ComboboxProps['onOptionSelect'] = React.useCallback(
    (event: SelectionEvents, data: OptionOnSelectData) => {
      const value = data.optionValue;
      if (!value || value.startsWith('header-')) {
        return;
      }

      const [species, setName] = value.split('|');
      onSelectionChange({ species, setName });
    },
    [onSelectionChange]
  );

  // Render options grouped by species
  const renderOptions = () => {
    return Object.keys(availableSets)
      .sort()
      .map((species) => {
        const sets = availableSets[species];
        const setNames = Object.keys(sets).sort();
        
        if (showBlankOption) {
          setNames.push('Blank Set');
        }

        return (
          <OptionGroup key={species} label={species.charAt(0).toUpperCase() + species.slice(1)}>
            {setNames.map((setName) => (
              <Option
                key={`${species}|${setName}`}
                value={`${species}|${setName}`}
                text={`${species} (${setName})`}
              >
                {setName}
              </Option>
            ))}
          </OptionGroup>
        );
      });
  };

  return (
    <Combobox
      placeholder="Select a Pokemon set"
      aria-label={label}
      value={selectedValue}
      freeform={true}
      onOptionSelect={handleOptionSelect}
      style={{ width: '300px' }}
    >
      {renderOptions()}
    </Combobox>
  );
};
