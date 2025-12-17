import { Input, Label } from '@fluentui/react-components';
import * as React from 'react';
import { useStyles } from './HPBar.styles';

export interface HPBarProps {
  /**
   * Current HP value
   */
  currentHp: number;
  
  /**
   * Maximum HP value
   */
  maxHp: number;
  
  /**
   * Callback when current HP changes
   */
  onHpChange: (newHp: number) => void;
  
  /**
   * Whether the inputs are disabled
   */
  disabled?: boolean;
}

/**
 * HPBar component - displays HP inputs and a visual health bar
 */
export const HPBar: React.FC<HPBarProps> = ({
  currentHp,
  maxHp,
  onHpChange,
  disabled = false,
}) => {
  const styles = useStyles();
  
  // Calculate HP percentage
  const hpPercentage = maxHp > 0 ? Math.floor((currentHp / maxHp) * 100) : 100;

  // Local state for raw input values (what the user is typing)
  // Initialize with functions to avoid stale values
  const [hpValueInput, setHpValueInput] = React.useState<string>(() => currentHp.toString());
  const [hpPercentageInput, setHpPercentageInput] = React.useState<string>(() => {
    const percentage = maxHp > 0 ? Math.floor((currentHp / maxHp) * 100) : 100;
    return percentage.toString();
  });
  
  // Track focus state
  const [isHpValueFocused, setIsHpValueFocused] = React.useState(false);
  const [isHpPercentageFocused, setIsHpPercentageFocused] = React.useState(false);

  // Update local state when props change (but only if not focused)
  React.useEffect(() => {
    if (!isHpValueFocused) {
      setHpValueInput(currentHp.toString());
    }
  }, [currentHp, isHpValueFocused]);

  React.useEffect(() => {
    if (!isHpPercentageFocused) {
      setHpPercentageInput(hpPercentage.toString());
    }
  }, [hpPercentage, isHpPercentageFocused]);

  // Handle HP value change (during typing - allow any input)
  const handleHpValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHpValueInput(event.target.value);
  };

  // Handle HP value blur (validate and snap)
  const handleHpValueBlur = () => {
    setIsHpValueFocused(false);
    const value = parseInt(hpValueInput, 10);
    if (!isNaN(value) && value >= 0 && value <= maxHp) {
      onHpChange(value);
    } else {
      // Reset to current valid value if invalid
      setHpValueInput(currentHp.toString());
    }
  };

  // Handle HP percentage change (during typing - allow any input)
  const handleHpPercentageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHpPercentageInput(event.target.value);
  };

  // Handle HP percentage blur (validate and snap)
  const handleHpPercentageBlur = () => {
    setIsHpPercentageFocused(false);
    const percentage = parseInt(hpPercentageInput, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      // Calculate new HP from percentage (always round down)
      const newHp = Math.floor(maxHp * percentage / 100);
      onHpChange(newHp);
    } else {
      // Reset to current valid value if invalid
      setHpPercentageInput(hpPercentage.toString());
    }
  };

  // Determine health bar color based on percentage
  const getHealthBarColor = () => {
    if (hpPercentage > 50) return '#6dd192';
    if (hpPercentage > 20) return '#d3c644';
    return '#d45c47';
  };

  return (
    <div className={styles.container}>
      {/* HP inputs */}
      <div className={styles.inputRow}>
        <Label className={styles.label}>HP:</Label>
        <Input
          type="number"
          value={hpValueInput}
          onChange={handleHpValueChange}
          onFocus={() => setIsHpValueFocused(true)}
          onBlur={handleHpValueBlur}
          min={0}
          max={maxHp}
          className={styles.hpInput}
          disabled={disabled}
        />
        <span>/</span>
        <span>{maxHp}</span>
        <span>(</span>
        <Input
          type="number"
          value={hpPercentageInput}
          onChange={handleHpPercentageChange}
          onFocus={() => setIsHpPercentageFocused(true)}
          onBlur={handleHpPercentageBlur}
          min={0}
          max={100}
          className={styles.hpInput}
          disabled={disabled}
        />
        <span>% )</span>
      </div>
      
      {/* Health bar */}
      <div className={styles.healthBarContainer}>
        <div 
          className={styles.healthBar}
          style={{
            width: `${hpPercentage}%`,
            backgroundColor: getHealthBarColor(),
          }}
        />
      </div>
    </div>
  );
};
