import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Terrain, Weather } from '@smogon/calc/dist/data/interface';
import { nextTrainer, previousTrainer, setTrainerIndex } from './trainerSlice';

/**
 * Side-specific field state (screens, hazards, tailwind)
 */
export interface SideFieldState {
  /** Light Screen active */
  isLightScreen: boolean;
  /** Reflect active */
  isReflect: boolean;
  /** Aurora Veil active */
  isAuroraVeil: boolean;
  /** Tailwind active */
  isTailwind: boolean;
  /** Stealth Rocks active */
  isSR: boolean;
  /** Spikes layers (0-3) */
  spikes: number;
}

/**
 * Complete field state configuration
 */
export interface FieldState {
  /** Active terrain */
  terrain?: Terrain;
  /** Active weather */
  weather?: Weather;
  /** Trick Room active */
  isTrickRoom: boolean;
  /** Player side field state */
  playerSide: SideFieldState;
  /** CPU side field state */
  cpuSide: SideFieldState;
}

const createDefaultSideState = (): SideFieldState => ({
  isLightScreen: false,
  isReflect: false,
  isAuroraVeil: false,
  isTailwind: false,
  isSR: false,
  spikes: 0,
});

const initialState: FieldState = {
  terrain: undefined,
  weather: undefined,
  isTrickRoom: false,
  playerSide: createDefaultSideState(),
  cpuSide: createDefaultSideState(),
};

/**
 * Redux slice for managing field state
 */
export const fieldSlice = createSlice({
  name: 'field',
  initialState,
  reducers: {
    setTerrain: (state, action: PayloadAction<Terrain | undefined>) => {
      state.terrain = action.payload;
    },
    setWeather: (state, action: PayloadAction<Weather | undefined>) => {
      state.weather = action.payload;
    },
    setTrickRoom: (state, action: PayloadAction<boolean>) => {
      state.isTrickRoom = action.payload;
    },
    setPlayerSideField: (state, action: PayloadAction<Partial<SideFieldState>>) => {
      state.playerSide = { ...state.playerSide, ...action.payload };
    },
    setCpuSideField: (state, action: PayloadAction<Partial<SideFieldState>>) => {
      state.cpuSide = { ...state.cpuSide, ...action.payload };
    },
    clearFieldState: (state) => {
      state.terrain = undefined;
      state.weather = undefined;
      state.isTrickRoom = false;
      state.playerSide = createDefaultSideState();
      state.cpuSide = createDefaultSideState();
    },
  },
  extraReducers: (builder) => {
    // Helper to reset field state to initial values
    const resetFieldState = (state: FieldState) => {
      Object.assign(state, {
        terrain: undefined,
        weather: undefined,
        isTrickRoom: false,
        playerSide: createDefaultSideState(),
        cpuSide: createDefaultSideState(),
      });
    };

    // Clear field state when trainer index changes
    builder
      .addCase(setTrainerIndex, (state) => {
        resetFieldState(state);
      })
      .addCase(nextTrainer, (state) => {
        resetFieldState(state);
      })
      .addCase(previousTrainer, (state) => {
        resetFieldState(state);
      });
  },
});

export const {
  setTerrain,
  setWeather,
  setTrickRoom,
  setPlayerSideField,
  setCpuSideField,
  clearFieldState,
} = fieldSlice.actions;

export default fieldSlice.reducer;
