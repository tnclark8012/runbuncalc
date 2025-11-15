import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedMove } from '../store/moveSlice';
import { MoveResultGroup, MoveItem } from './index';
import { PrimaryButton } from '@fluentui/react';

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
  const dispatch = useAppDispatch();
  const selectedMoveId = useAppSelector((state) => state.move.selectedMoveId);

  const handleMoveSelect = React.useCallback(
    (moveId: string) => {
      dispatch(setSelectedMove(moveId));
    },
    [dispatch]
  );

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
    <div style={{ padding: '1em' }}>
      <MoveResultGroup
        headerId={headerId}
        headerText={headerText}
        radioGroupName={radioGroupName}
        moves={moves}
        selectedMoveId={selectedMoveId}
        onMoveSelect={handleMoveSelect}
      />
      <div style={{ marginTop: '1em' }}>
        <PrimaryButton onClick={handleExport} text="Export Store to JSON" />
      </div>
      <div style={{ marginTop: '1em', fontSize: '0.9em', color: '#666' }}>
        <strong>Debug Info:</strong>
        <div>Selected Move ID: {selectedMoveId || 'None'}</div>
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
