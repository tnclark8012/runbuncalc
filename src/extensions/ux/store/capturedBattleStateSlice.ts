import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FieldState } from './fieldSlice';
import { PartyState } from './partySlice';
import { PokemonStateState } from './pokemonStateSlice';
import { nextTrainer, previousTrainer, setTrainerIndex } from './trainerSlice';

export interface PlannedTrainerActionState {
  type: 'move';
  pokemonSpecies: string;
  mega?: boolean;
  move: string;
  targetSlot?: number;
}
/**
 * Captured state that can be used to reconstruct a BattleFieldState
 */
export interface CapturedBattleStateData {
  /** Turn number when the state was captured (starts at 1) */
  turnNumber: number;
  
  /** Player party */
  party: PartyState;
  
  /** Current trainer index */
  trainerIndex: number;
  
  /** Pokemon runtime states (HP, boosts, status) */
  pokemonStates: PokemonStateState;
  
  /** Field state (terrain, weather, hazards, screens, etc.) */
  fieldState: FieldState;
  
  /** The player's planned action for this turn */
  plannedPlayerAction?: PlannedTrainerActionState;
}

/**
 * State shape for captured battle states
 */
export interface CapturedBattleStateState {
  capturedStates: CapturedBattleStateData[];
  currentTurnNumber: number;
  currentTrainerIndex: number;
  /** Index of the selected captured state (for viewing possible next states) */
  selectedStateIndex: number | null;
}

const initialState: CapturedBattleStateState = {
  capturedStates: [],
  currentTurnNumber: 1,
  currentTrainerIndex: 0,
  selectedStateIndex: null,
};

/**
 * Maximum number of captured battle states to keep in memory
 */
const MAX_CAPTURED_STATES = 100;

/**
 * Redux slice for managing captured battle states
 */
export const capturedBattleStateSlice = createSlice({
  name: 'capturedBattleState',
  initialState,
  reducers: {
    captureBattleState: (state, action: PayloadAction<CapturedBattleStateData>) => {
      // Prune any states with turnNumber >= the new capture's turnNumber
      // This allows branching - capturing a different action at an earlier turn
      state.capturedStates = state.capturedStates.filter(
        s => s.turnNumber < action.payload.turnNumber
      );
      
      state.capturedStates.push(action.payload);
      // Increment turn number for next capture
      state.currentTurnNumber += 1;
      // Keep only the most recent MAX_CAPTURED_STATES entries
      if (state.capturedStates.length > MAX_CAPTURED_STATES) {
        state.capturedStates = state.capturedStates.slice(-MAX_CAPTURED_STATES);
      }
    },
    clearCapturedStates: (state) => {
      state.capturedStates = [];
      state.currentTurnNumber = 1;
      state.selectedStateIndex = null;
    },
    selectCapturedState: (state, action: PayloadAction<number | null>) => {
      state.selectedStateIndex = action.payload;
    },
    setCurrentTurnNumber: (state, action: PayloadAction<number>) => {
      state.currentTurnNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Listen to trainer index changes and reset turn number
    builder
      .addCase(setTrainerIndex, (state, action) => {
        if (state.currentTrainerIndex !== action.payload) {
          state.currentTrainerIndex = action.payload;
          state.currentTurnNumber = 1;
          state.capturedStates = [];
          state.selectedStateIndex = null;
        }
      })
      .addCase(nextTrainer, (state) => {
        state.currentTurnNumber = 1;
        state.capturedStates = [];
        state.selectedStateIndex = null;
      })
      .addCase(previousTrainer, (state) => {
        state.currentTurnNumber = 1;
        state.capturedStates = [];
        state.selectedStateIndex = null;
      });
  },
});

export const { captureBattleState, clearCapturedStates, selectCapturedState, setCurrentTurnNumber } = capturedBattleStateSlice.actions;
export default capturedBattleStateSlice.reducer;
