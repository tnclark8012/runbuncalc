import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * State shape for the move selection
 */
export interface MoveState {
  selectedMoveId: string | undefined;
}

const initialState: MoveState = {
  selectedMoveId: undefined,
};

/**
 * Redux slice for managing move selection state
 */
export const moveSlice = createSlice({
  name: 'move',
  initialState,
  reducers: {
    setSelectedMove: (state, action: PayloadAction<string>) => {
      state.selectedMoveId = action.payload;
    },
    clearSelectedMove: (state) => {
      state.selectedMoveId = undefined;
    },
  },
});

export const { setSelectedMove, clearSelectedMove } = moveSlice.actions;
export default moveSlice.reducer;
