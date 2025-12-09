import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlannedTrainerAction } from '../../configuration';
import { PartyState } from './partySlice';
import { PokemonStateState } from './pokemonStateSlice';
import { setTrainerIndex, nextTrainer, previousTrainer } from './trainerSlice';

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
  
  /** The player's planned action for this turn */
  plannedPlayerAction?: PlannedTrainerAction;
}

/**
 * State shape for captured battle states
 */
export interface CapturedBattleStateState {
  capturedStates: CapturedBattleStateData[];
  currentTurnNumber: number;
  currentTrainerIndex: number;
}

const initialState: CapturedBattleStateState = {
  capturedStates: [],
  currentTurnNumber: 1,
  currentTrainerIndex: 0,
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
    },
  },
  extraReducers: (builder) => {
    // Helper function to reset turn number and clear captured states
    const resetCapturedState = (state: CapturedBattleStateState) => {
      state.currentTurnNumber = 1;
      state.capturedStates = [];
    };

    // Listen to trainer index changes and reset turn number
    builder
      .addCase(setTrainerIndex, (state, action) => {
        if (state.currentTrainerIndex !== action.payload) {
          state.currentTrainerIndex = action.payload;
          resetCapturedState(state);
        }
      })
      .addCase(nextTrainer, (state) => {
        resetCapturedState(state);
      })
      .addCase(previousTrainer, (state) => {
        resetCapturedState(state);
      });
  },
});

export const { captureBattleState, clearCapturedStates } = capturedBattleStateSlice.actions;
export default capturedBattleStateSlice.reducer;
