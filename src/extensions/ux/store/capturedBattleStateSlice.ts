import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlannedTrainerAction } from '../../configuration';
import { PartyState } from './partySlice';
import { PokemonStateState } from './pokemonStateSlice';
import { SetState } from './setSlice';
import { TrainerState } from './trainerSlice';

/**
 * Captured state that can be used to reconstruct a BattleFieldState
 */
export interface CapturedBattleStateData {
  /** Timestamp when the state was captured */
  timestamp: number;
  
  /** Player and CPU set selections and available sets */
  sets: SetState;
  
  /** Player party */
  party: PartyState;
  
  /** Current trainer index */
  trainer: TrainerState;
  
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
}

const initialState: CapturedBattleStateState = {
  capturedStates: [],
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
      // Keep only the most recent MAX_CAPTURED_STATES entries
      if (state.capturedStates.length > MAX_CAPTURED_STATES) {
        state.capturedStates = state.capturedStates.slice(-MAX_CAPTURED_STATES);
      }
    },
    clearCapturedStates: (state) => {
      state.capturedStates = [];
    },
  },
});

export const { captureBattleState, clearCapturedStates } = capturedBattleStateSlice.actions;
export default capturedBattleStateSlice.reducer;
