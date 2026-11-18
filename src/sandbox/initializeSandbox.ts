import { Dispatch } from '@reduxjs/toolkit';
import { getPokemonId } from '../extensions/core/storage';
import { SetCollectionData } from '../extensions/core/storage.contracts';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../extensions/trainer-sets';
import { TrainerSets } from '../extensions/trainer-sets.data';
import { loadPlayerParty } from '../extensions/ux/store/partySlice';
import { clearPlayerSet, loadCpuSets, loadPlayerSets, setCpuSet, setPlayerSet, SetState } from '../extensions/ux/store/setSlice';
import { setTrainerIndex, TrainerState } from '../extensions/ux/store/trainerSlice';

// Run after rehydration so persisted empty selections cannot overwrite the defaults.
export const initializeSandbox = ({ customSets, party }: SetCollectionData) => (
  dispatch: Dispatch,
  getState: () => { set: SetState; trainer: TrainerState }
): void => {
  const { set, trainer } = getState();
  const playerSelections = Object.keys(customSets)
    .sort((a, b) => a.localeCompare(b))
    .flatMap(species => Object.keys(customSets[species]).map(setName => ({ species, setName })));
  const playerSelection = set.player.selection;
  const hasPlayerSelection = playerSelection &&
    customSets[playerSelection.species]?.[playerSelection.setName];
  const defaultPlayerSelection = party
    .map(id => playerSelections.find(selection => getPokemonId(selection.species, selection.setName) === id))
    .find(selection => selection !== undefined) || playerSelections[0];

  const trainerIndex = getTrainerNameByTrainerIndex(trainer.currentTrainerIndex) ?
    trainer.currentTrainerIndex : 0;
  const trainerName = getTrainerNameByTrainerIndex(trainerIndex);
  const trainerParty = OpposingTrainer(trainerName);
  const cpuSelection = set.cpu.selection;
  const hasCpuSelection = cpuSelection?.setName.trim() === trainerName &&
    trainerParty.some(pokemon => pokemon.species.name === cpuSelection.species);

  dispatch(loadPlayerSets(customSets));
  dispatch(loadPlayerParty(party));
  dispatch(loadCpuSets(TrainerSets));
  dispatch(setTrainerIndex(trainerIndex));
  if (!hasPlayerSelection) {
    dispatch(defaultPlayerSelection ? setPlayerSet(defaultPlayerSelection) : clearPlayerSet());
  }
  if (!hasCpuSelection) {
    dispatch(setCpuSet({ species: trainerParty[0].species.name, setName: trainerName }));
  }
};
