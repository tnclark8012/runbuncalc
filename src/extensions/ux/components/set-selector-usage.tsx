/**
 * Initialize the SetSelector components for player and CPU
 */

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { getActiveCollection } from '../../core/storage';
import { CustomSets } from '../../core/storage.contracts';
import { TrainerSets } from '../../trainer-sets.data';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCpuSets, loadPlayerSets, setCpuSet, setPlayerSet } from '../store/setSlice';
import { persistor, store } from '../store/store';
import { SetSelector } from './SetSelector';

// Store roots for potential cleanup/updates
let playerSetSelectorRoot: Root | null = null;
let cpuSetSelectorRoot: Root | null = null;

/**
 * Connected wrapper component for Player SetSelector
 */
const PlayerSetSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection, availableSets } = useAppSelector((state) => state.set.player);

  const handleSelectionChange = React.useCallback(
    (newSelection: { species?: string; setName?: string }) => {
      dispatch(setPlayerSet(newSelection));
    },
    [dispatch]
  );

  return (
    <SetSelector
      label="Player Set"
      selection={selection}
      availableSets={availableSets}
      onSelectionChange={handleSelectionChange}
      showBlankOption={true}
    />
  );
};

/**
 * Connected wrapper component for CPU SetSelector
 */
const CpuSetSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selection, availableSets } = useAppSelector((state) => state.set.cpu);

  const handleSelectionChange = React.useCallback(
    (newSelection: { species?: string; setName?: string }) => {
      dispatch(setCpuSet(newSelection));
    },
    [dispatch]
  );

  return (
    <SetSelector
      label="CPU Set"
      selection={selection}
      availableSets={availableSets}
      onSelectionChange={handleSelectionChange}
      showBlankOption={false}
    />
  );
};

/**
 * Load example Pokemon sets data
 * In a real application, this would load from SETDEX_* globals or an API
 */
function getExampleSets(): CustomSets {
  return {
    abomasnow: {
      'Winstrate Victoria': {
        level: 50,
        ability: 'Snow Warning',
        item: 'Abomasite',
        nature: 'Modest',
        moves: ['Blizzard', 'Giga Drain', 'Ice Shard', 'Protect'],
      },
      'Bug Catcher Davis': {
        level: 45,
        ability: 'Snow Warning',
        nature: 'Timid',
        moves: ['Blizzard', 'Energy Ball', 'Focus Blast', 'Hidden Power Fire'],
      },
    },
    pikachu: {
      'Youngster Joey': {
        level: 25,
        ability: 'Static',
        item: 'Light Ball',
        nature: 'Jolly',
        moves: ['Volt Tackle', 'Quick Attack', 'Thunder Wave', 'Iron Tail'],
      },
      'Ace Trainer Sarah': {
        level: 50,
        ability: 'Lightning Rod',
        item: 'Light Ball',
        nature: 'Timid',
        moves: ['Thunderbolt', 'Grass Knot', 'Hidden Power Ice', 'Volt Switch'],
      },
    },
    charizard: {
      'Champion Red': {
        level: 84,
        ability: 'Blaze',
        item: 'Charizardite Y',
        nature: 'Timid',
        moves: ['Fire Blast', 'Solar Beam', 'Focus Blast', 'Roost'],
      },
    },
  };
}

/**
 * Initialize the player SetSelector component
 */
export function initializePlayerSetSelector(): void {
  const container = document.getElementById('player-set-selector');

  if (container) {
    // Load example sets into Redux store
    const playerSets = getActiveCollection().customSets;
    store.dispatch(loadPlayerSets(playerSets));

    if (!playerSetSelectorRoot) {
      playerSetSelectorRoot = createRoot(container);
    }
    playerSetSelectorRoot.render(
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PlayerSetSelector />
        </PersistGate>
      </Provider>
    );
  }
}

/**
 * Initialize the CPU SetSelector component
 */
export function initializeCpuSetSelector(): void {
  const container = document.getElementById('cpu-set-selector');

  if (container) {
    // Load example sets into Redux store
    const exampleSets = getExampleSets();
    const realSets: CustomSets = TrainerSets;
    store.dispatch(loadCpuSets(realSets));

    if (!cpuSetSelectorRoot) {
      cpuSetSelectorRoot = createRoot(container);
    }
    cpuSetSelectorRoot.render(
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <CpuSetSelector />
        </PersistGate>
      </Provider>
    );
  }
}

/**
 * Initialize both SetSelector components
 */
export function initializeSetSelectors(): void {
  initializePlayerSetSelector();
  initializeCpuSetSelector();
}
