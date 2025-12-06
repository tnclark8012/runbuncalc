import { Combobox, ComboboxProps, Option, OptionGroup, OptionOnSelectData, SelectionEvents } from '@fluentui/react-components';
import * as React from 'react';
import { CustomSets } from '../../../core/storage.contracts';
import { SetSelection } from '../../store/setSlice';
import { filterSetsBySearch } from './SetSelector.utils';

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
 * with species as group headers and set names as selectable options.
 * 
 * Features:
 * - Search by Pokemon species name OR trainer name
 * - Case-insensitive filtering
 * - Freeform input for quick searching
 * 
 * Performance Note:
 * FluentUI v9 Combobox doesn't have built-in virtualization support.
 * However, the search/filter functionality significantly reduces the number
 * of rendered options, providing good performance even with thousands of items.
 * When the user types, only matching items are rendered.
 */
export const SetSelector: React.FC<SetSelectorProps> = ({ 
  label,
  selection,
  availableSets,
  onSelectionChange,
  showBlankOption = false,
}) => {
  // Track input value separately from selection for freeform search
  const [inputValue, setInputValue] = React.useState('');

  // Update input value when selection changes from external source
  React.useEffect(() => {
    if (selection.species && selection.setName) {
      setInputValue(`${selection.species} (${selection.setName})`);
    } else {
      setInputValue('');
    }
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

  // Filter options based on search input
  const getFilteredOptions = React.useCallback(() => {
    return filterSetsBySearch(availableSets, inputValue);
  }, [inputValue, availableSets]);

  // Render options grouped by species
  const renderOptions = () => {
    const filteredSets = getFilteredOptions();
    const searchTerm = inputValue.trim();
    
    return Object.keys(filteredSets)
      .sort()
      .map((species) => {
        const sets = filteredSets[species];
        const setNames = Object.keys(sets).sort();
        
        // Only show blank option when search is empty (after trimming)
        if (showBlankOption && !searchTerm) {
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
      value={inputValue}
      onInput={(e) => setInputValue(e.currentTarget.value)}
      freeform={true}
      onOptionSelect={handleOptionSelect}
      style={{ width: '300px' }}
    >
      {renderOptions()}
    </Combobox>
  );
};
