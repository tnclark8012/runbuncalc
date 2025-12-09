import { Button } from '@fluentui/react-components';
import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedMove } from '../store/moveSlice';
import { persistor, store } from '../store/store';
import { MoveItem, MoveResultGroup } from './index';
import { useStyles } from './DeveloperTools.styles';

/**
 * Props for the DeveloperTools component
 */
export interface DeveloperToolsProps {
  moves: MoveItem[];
  headerId?: string;
  headerText?: string;
  radioGroupName?: string;
}

/**
 * Internal component that connects to Redux store
 */
const DeveloperToolsContent: React.FC<DeveloperToolsProps> = ({
  moves,
  headerId = 'devToolsHeader',
  headerText = 'Move Selection (Redux + Local Storage)',
  radioGroupName = 'devToolsMoves',
}) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const selectedMoveName = useAppSelector((state) => state.move.selectedMoveName);

  const handleMoveSelect = React.useCallback(
    (moveId: string) => {
      // Extract move name from the selected move
      const move = moves.find(m => m.id === moveId);
      if (move) {
        dispatch(setSelectedMove(move.name));
      }
    },
    [dispatch, moves]
  );

  // Find the move ID that matches the selected move name
  const selectedMoveId = React.useMemo(() => {
    if (!selectedMoveName) return undefined;
    const move = moves.find(m => m.name === selectedMoveName);
    return move?.id;
  }, [selectedMoveName, moves]);

  const handleExport = React.useCallback(() => {
    // Get the current state from the Redux store
    const state = store.getState();
    
    // Serialize the state to JSON
    const stateJson = JSON.stringify(state, null, 2);
    
    // Create a blob and download it as JSON
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Create filesystem-safe filename (replace colons and dots from ISO string)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `redux-store-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className={styles.container}>
      <MoveResultGroup
        headerId={headerId}
        headerText={headerText}
        radioGroupName={radioGroupName}
        moves={moves}
        selectedMoveId={selectedMoveId}
        onMoveSelect={handleMoveSelect}
      />
      <div className={styles.exportButton}>
        <Button appearance="primary" onClick={handleExport}>Export Store to JSON</Button>
      </div>
      <div className={styles.debugInfo}>
        <strong>Debug Info:</strong>
        <div>Selected Move: {selectedMoveName || 'None'}</div>
      </div>
    </div>
  );
};

/**
 * DeveloperTools component - demonstrates Redux + Local Storage integration
 * 
 * Features:
 * 1. Renders MoveResultGroup component
 * 2. Saves selection changes to Redux store
 * 3. Persists state to local storage automatically
 * 4. Provides export button to download store as JSON
 * 5. Hydrates from local storage on page load
 */
export const DeveloperTools: React.FC<DeveloperToolsProps> = (props) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <DeveloperToolsContent {...props} />
      </PersistGate>
    </Provider>
  );
};

export default DeveloperTools;
