import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { addToParty, removeFromParty } from '../../core/storage';

/**
 * State shape for the party management
 */
export interface PartyState {
  playerParty: string[]; // Array of Pokemon IDs in format "species (setName)"
}

const initialState: PartyState = {
  playerParty: [],
};

/**
 * Redux slice for managing player party state
 */
export const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    loadPlayerParty: (state, action: PayloadAction<string[]>) => {
      state.playerParty = action.payload;
    },
    promoteToParty: (state, action: PayloadAction<string>) => {
      const pokemonId = action.payload;
      if (!state.playerParty.includes(pokemonId)) {
        state.playerParty.push(pokemonId);
        // Persist immediately to localStorage
        addToParty(pokemonId);
      }
    },
    demoteToBox: (state, action: PayloadAction<string>) => {
      const pokemonId = action.payload;
      const index = state.playerParty.indexOf(pokemonId);
      if (index !== -1) {
        state.playerParty.splice(index, 1);
        // Persist immediately to localStorage
        removeFromParty(pokemonId);
      }
    },
    clearParty: (state) => {
      state.playerParty = [];
    },
  },
});

export const {
  loadPlayerParty,
  promoteToParty,
  demoteToBox,
  clearParty,
} = partySlice.actions;

export default partySlice.reducer;
