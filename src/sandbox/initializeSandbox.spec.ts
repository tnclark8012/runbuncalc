import { configureStore } from '@reduxjs/toolkit';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../extensions/trainer-sets';
import partyReducer from '../extensions/ux/store/partySlice';
import setReducer, { setCpuSet, setPlayerSet } from '../extensions/ux/store/setSlice';
import trainerReducer, { setTrainerIndex } from '../extensions/ux/store/trainerSlice';
import { initializeSandbox } from './initializeSandbox';

const customSets = {
  Bulbasaur: { 'Box Set': { moves: ['Tackle'] } },
  Squirtle: { 'Party Set': { moves: ['Water Gun'] } },
};

function createStore() {
  return configureStore({
    reducer: { set: setReducer, party: partyReducer, trainer: trainerReducer },
  });
}

describe('sandbox initialization after rehydration', () => {
  it('selects the first party member, not the first species in the box', () => {
    const store = createStore();
    store.dispatch(initializeSandbox({ customSets, party: ['Squirtle (Party Set)', 'Bulbasaur (Box Set)'] }));
    expect(store.getState().set.player.selection).toEqual({ species: 'Squirtle', setName: 'Party Set' });
    expect(store.getState().party.playerParty).toEqual(['Squirtle (Party Set)', 'Bulbasaur (Box Set)']);
  });

  it('selects the first displayed box member when the party is empty or stale', () => {
    for (const party of [[], ['Missing (Set)']]) {
      const store = createStore();
      store.dispatch(setPlayerSet({ species: '', setName: '' }));
      store.dispatch(initializeSandbox({
        customSets: { Squirtle: customSets.Squirtle, Bulbasaur: customSets.Bulbasaur },
        party,
      }));
      expect(store.getState().set.player.selection).toEqual({ species: 'Bulbasaur', setName: 'Box Set' });
    }
  });

  it('defaults to the first trainer and their lead rather than the first species in TrainerSets', () => {
    const store = createStore();
    store.dispatch(initializeSandbox({ customSets, party: [] }));
    const trainerName = getTrainerNameByTrainerIndex(0);
    expect(store.getState().trainer.currentTrainerIndex).toBe(0);
    expect(store.getState().set.cpu.selection).toEqual({
      species: OpposingTrainer(trainerName)[0].species.name,
      setName: trainerName,
    });
  });

  it('selects the saved trainer lead when the saved CPU selection is empty or belongs to another trainer', () => {
    for (const selection of [undefined, { species: '', setName: '' }, { species: 'Bulbasaur', setName: 'Missing Trainer' }]) {
      const store = createStore();
      store.dispatch(setTrainerIndex(10));
      if (selection) store.dispatch(setCpuSet(selection));
      store.dispatch(initializeSandbox({ customSets, party: [] }));
      const trainerName = getTrainerNameByTrainerIndex(10);
      expect(store.getState().trainer.currentTrainerIndex).toBe(10);
      expect(store.getState().set.cpu.selection).toEqual({
        species: OpposingTrainer(trainerName)[0].species.name,
        setName: trainerName,
      });
    }
  });

  it('preserves valid saved selections, including a non-lead CPU Pokemon', () => {
    const store = createStore();
    const trainerName = getTrainerNameByTrainerIndex(10);
    const cpuSelection = { species: OpposingTrainer(trainerName)[1].species.name, setName: trainerName };
    const playerSelection = { species: 'Bulbasaur', setName: 'Box Set' };
    store.dispatch(setTrainerIndex(10));
    store.dispatch(setPlayerSet(playerSelection));
    store.dispatch(setCpuSet(cpuSelection));
    store.dispatch(initializeSandbox({ customSets, party: ['Squirtle (Party Set)'] }));
    expect(store.getState().set.player.selection).toEqual(playerSelection);
    expect(store.getState().set.cpu.selection).toEqual(cpuSelection);
  });

  it('recovers from a removed player set and an invalid trainer index', () => {
    const store = createStore();
    store.dispatch(setPlayerSet({ species: 'Missing', setName: 'Set' }));
    store.dispatch(setTrainerIndex(999999));
    store.dispatch(initializeSandbox({ customSets, party: [] }));
    expect(store.getState().set.player.selection).toEqual({ species: 'Bulbasaur', setName: 'Box Set' });
    expect(store.getState().trainer.currentTrainerIndex).toBe(0);
  });

  it('leaves the player unselected when no Pokemon are available', () => {
    const store = createStore();
    store.dispatch(setPlayerSet({ species: 'Missing', setName: 'Set' }));
    store.dispatch(initializeSandbox({ customSets: {}, party: [] }));
    expect(store.getState().set.player.selection).toBeUndefined();
    expect(store.getState().set.cpu.selection?.species).toBeTruthy();
  });
});
