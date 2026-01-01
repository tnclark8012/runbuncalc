import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * State shape for trainer navigation
 */
export interface TrainerState {
  currentTrainerIndex: number;
}

const initialState: TrainerState = {
  currentTrainerIndex: 0,
};

/**
 * Redux slice for managing CPU trainer navigation
 */
export const trainerSlice = createSlice({
  name: 'trainer',
  initialState,
  reducers: {
    setTrainerIndex: (state, action: PayloadAction<number>) => {
      state.currentTrainerIndex = action.payload;
    }
  },
});

/**
 * Thunk action to load a trainer by index and update CPU sets
 */
export const loadTrainerByIndex = (trainerIndex: number) => (dispatch: any) => {
  dispatch(setTrainerIndex(trainerIndex));
};

export const { setTrainerIndex } = trainerSlice.actions;

export default trainerSlice.reducer;
