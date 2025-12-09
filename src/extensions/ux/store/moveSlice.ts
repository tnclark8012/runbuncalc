import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * State shape for the move selection
 */
export interface MoveState {
  selectedMoveName: string | undefined;
}

const initialState: MoveState = {
  selectedMoveName: undefined,
};

/**
 * Redux slice for managing move selection state
 */
export const moveSlice = createSlice({
  name: 'move',
  initialState,
  reducers: {
    setSelectedMove: (state, action: PayloadAction<string>) => {
      state.selectedMoveName = action.payload;
    },
    clearSelectedMove: (state) => {
      state.selectedMoveName = undefined;
    },
  },
});

export const { setSelectedMove, clearSelectedMove } = moveSlice.actions;
export default moveSlice.reducer;
