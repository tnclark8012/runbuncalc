/**
 * Component for capturing the current battle state
 */

import { Button } from '@fluentui/react-components';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { selectBattleFieldState } from '../store/battleFieldStateSelector';
import { RootState } from '../store/store';

/**
 * Component that provides a button to capture the current battle state
 */
export const CaptureBattleState: React.FC = () => {
  const battleState = useSelector((state: RootState) => selectBattleFieldState(state));

  const handleCapture = React.useCallback(() => {
    if (!battleState) {
      console.warn('Cannot capture battle state: Missing required selections');
      return;
    }

    console.log('Captured BattleFieldState:');
    console.log(battleState);
    console.log(battleState.toString());
  }, [battleState]);

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      <Button appearance="primary" onClick={handleCapture}>
        Capture Battle State
      </Button>
    </div>
  );
};
