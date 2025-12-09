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

  // Handle HP value change
  const handleHpValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= maxHp) {
      onHpChange(value);
    }
  };

  // Handle HP percentage change
  const handleHpPercentageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(event.target.value, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      // Calculate new HP from percentage (always round down)
      const newHp = Math.floor(maxHp * percentage / 100);
      onHpChange(newHp);
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
          value={currentHp.toString()}
          onChange={handleHpValueChange}
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
          value={hpPercentage.toString()}
          onChange={handleHpPercentageChange}
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
