/**
 * Tests for CaptureBattleState component
 */

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import capturedBattleStateReducer from '../store/capturedBattleStateSlice';
import moveReducer from '../store/moveSlice';
import partyReducer from '../store/partySlice';
import pokemonStateReducer from '../store/pokemonStateSlice';
import setReducer from '../store/setSlice';
import trainerReducer from '../store/trainerSlice';
import { CaptureBattleState } from './CaptureBattleState';

describe('CaptureBattleState', () => {
  it('renders without crashing', () => {
    const store = configureStore({
      reducer: {
        move: moveReducer,
        set: setReducer,
        party: partyReducer,
        trainer: trainerReducer,
        pokemonState: pokemonStateReducer,
        capturedBattleState: capturedBattleStateReducer,
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaptureBattleState />
      </Provider>
    );

    expect(getByText('Capture Battle State')).toBeTruthy();
  });
});
