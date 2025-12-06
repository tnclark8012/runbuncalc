import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StatusName } from '@smogon/calc/dist/data/interface';
import { StatsTable } from '@smogon/calc/src';

/**
 * Runtime state for a Pokemon (boosts, status, current HP, etc.)
 */
export interface PokemonState {
  /**
   * Current stat boosts (-6 to +6 for each stat)
   */
  boosts?: Partial<StatsTable>;
  
  /**
   * Current status condition
   */
  status?: StatusName | '';
  
  /**
   * Current HP
   */
  currentHp?: number;
}

/**
 * Map of Pokemon ID to their runtime state
 * Key format: "species (setName)" from getPokemonId()
 */
export type PokemonStateMap = { [pokemonId: string]: PokemonState };

/**
 * State shape for Pokemon runtime state
 */
export interface PokemonStateState {
  player: PokemonStateMap;
  cpu: PokemonStateMap;
}

const initialState: PokemonStateState = {
  player: {},
  cpu: {},
};

/**
 * Redux slice for managing Pokemon runtime state (HP, boosts, status)
 */
export const pokemonStateSlice = createSlice({
  name: 'pokemonState',
  initialState,
  reducers: {
    setPlayerPokemonState: (state, action: PayloadAction<{ pokemonId: string; state: PokemonState }>) => {
      state.player[action.payload.pokemonId] = action.payload.state;
    },
    setCpuPokemonState: (state, action: PayloadAction<{ pokemonId: string; state: PokemonState }>) => {
      state.cpu[action.payload.pokemonId] = action.payload.state;
    },
    clearPlayerStates: (state) => {
      state.player = {};
    },
    clearCpuStates: (state) => {
      state.cpu = {};
    },
  },
});

export const {
  setPlayerPokemonState,
  setCpuPokemonState,
  clearPlayerStates,
  clearCpuStates,
} = pokemonStateSlice.actions;

export default pokemonStateSlice.reducer;
