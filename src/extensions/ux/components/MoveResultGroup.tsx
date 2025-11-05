import * as React from 'react';
import { ChoiceGroup, IChoiceGroupOption, Label, Stack } from '@fluentui/react';
import { MoveResultGroupProps, MoveItem } from './move-result-group.props';

/**
 * MoveResultGroup component - renders a radio group containing each move 
 * and the damage% range it can do to the opponent.
 * 
 * This component uses Fluent UI's ChoiceGroup for accessibility and styling.
 */
export const MoveResultGroup: React.FC<MoveResultGroupProps> = ({
  headerId,
  headerText,
  radioGroupName,
  moves,
  onMoveSelect,
  selectedMoveId,
}) => {
  // Convert MoveItem array to IChoiceGroupOption array for Fluent UI
  const options: IChoiceGroupOption[] = moves.map((move: MoveItem) => ({
    key: move.id,
    text: move.name,
    // Store additional data in the option's data property
    data: {
      damageRange: move.damageRange,
      damagePercent: move.damagePercent,
      position: move.position,
    },
    // Custom render for each option to include damage information
    onRenderField: (props, render) => {
      return (
        <div className="move-option-container">
          <label 
            className={`btn btn-xxxwide btn-${move.position}`} 
            htmlFor={move.id}
          >
            {move.name}
          </label>
          <span 
            id={`resultDamage${move.id.replace('resultMove', '')}`}
            className="damage-display"
          >
            {move.damagePercent}
          </span>
        </div>
      );
    },
  }));

  // Handle selection change
  const handleChange = React.useCallback(
    (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => {
      if (option && onMoveSelect) {
        onMoveSelect(option.key);
      }
    },
    [onMoveSelect]
  );

  // Determine the default selected key
  const defaultSelectedKey = React.useMemo(() => {
    if (selectedMoveId) {
      return selectedMoveId;
    }
    const defaultMove = moves.find(m => m.defaultChecked);
    return defaultMove ? defaultMove.id : (moves.length > 0 ? moves[0].id : undefined);
  }, [selectedMoveId, moves]);

  return (
    <div 
      className="move-result-subgroup" 
      role="radiogroup" 
      aria-labelledby={headerId}
    >
      <div className="result-move-header">
        <Label id={headerId}>{headerText}</Label>
      </div>
      <Stack tokens={{ childrenGap: 0 }}>
        <ChoiceGroup
          options={options}
          onChange={handleChange}
          defaultSelectedKey={defaultSelectedKey}
          aria-labelledby={headerId}
        />
      </Stack>
    </div>
  );
};

export default MoveResultGroup;
