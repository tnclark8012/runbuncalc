import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CustomSets } from '../../core/storage.contracts';

/**
 * Pokemon set data structure
 */

export interface StatsTable {
  hp?: number;
  at?: number;
  df?: number;
  sa?: number;
  sd?: number;
  sp?: number;
}

/**
 * Selection state for a single side (player or CPU)
 */
export interface SetSelection {
  species?: string;
  setName?: string;
}

/**
 * State shape for the set selection
 */
export interface SetState {
  player: {
    selection: SetSelection;
    availableSets: CustomSets;
  };
  cpu: {
    selection: SetSelection;
    availableSets: CustomSets;
  };
}

const initialState: SetState = {
  player: {
    selection: {},
    availableSets: {},
  },
  cpu: {
    selection: {},
    availableSets: {},
  },
};

/**
 * Redux slice for managing Pokemon set selection state
 */
export const setSlice = createSlice({
  name: 'set',
  initialState,
  reducers: {
    setPlayerSet: (state, action: PayloadAction<SetSelection>) => {
      state.player.selection = action.payload;
    },
    setCpuSet: (state, action: PayloadAction<SetSelection>) => {
      state.cpu.selection = action.payload;
    },
    clearPlayerSet: (state) => {
      state.player.selection = {};
    },
    clearCpuSet: (state) => {
      state.cpu.selection = {};
    },
    loadPlayerSets: (state, action: PayloadAction<CustomSets>) => {
      state.player.availableSets = action.payload;
    },
    /** Initializes all available sets in the store. Should only be called once at app initialization */
    loadCpuSets: (state, action: PayloadAction<CustomSets>) => {
      state.cpu.availableSets = action.payload;
    },
  },
});

export const {
  setPlayerSet,
  setCpuSet,
  clearPlayerSet,
  clearCpuSet,
  loadPlayerSets,
  loadCpuSets,
} = setSlice.actions;

export default setSlice.reducer;
