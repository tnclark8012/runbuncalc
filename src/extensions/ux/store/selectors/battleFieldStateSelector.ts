import { Field, Pokemon } from '@smogon/calc';
import { PokemonOptions } from '@smogon/calc/dist/pokemon';
import { createSelector } from 'reselect';
import { gen } from '../../../configuration';
import { getPokemonId } from '../../../core/storage';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../../simulator/moveScoring.contracts';
import { popFromParty } from '../../../simulator/phases/switching/execute-switch';
import { convertIVsFromCustomSetToPokemon } from '../../../simulator/utils';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../../../trainer-sets';
import { parsePokemonId } from '../../party';
import { RootState } from '../store';

const selectPlayerSet = (state: RootState) => state.set.player;
const selectCpuSet = (state: RootState) => state.set.cpu;
const selectTrainer = (state: RootState) => state.trainer;
const selectPokemonState = (state: RootState) => state.pokemonState;
const selectPlayerParty = (state: RootState) => state.party.playerParty;
const selectFieldState = (state: RootState) => state.field;

/**
 * Creates a BattleFieldState from the current Redux state
 * Returns undefined if the required selections are not present
 */
export const selectBattleFieldState = createSelector(
  [selectPlayerSet, selectCpuSet, selectPlayerParty, selectTrainer, selectPokemonState, selectFieldState],
  (playerState, cpuState, playerParty, trainerState, pokemonStates, fieldState): BattleFieldState | undefined => {

    const cpuSelection = cpuState.selection;
    const playerSelection = playerState.selection;

    if (!playerSelection || !cpuSelection) {
      return undefined;
    }

    // Helper to apply Pokemon state from Redux
    const applyPokemonState = (pokemon: Pokemon, pokemonId: string, side: 'player' | 'cpu') => {
      const stateData = side === 'player'
        ? pokemonStates.player[pokemonId]
        : pokemonStates.cpu[pokemonId];

      const clonedOptions: PokemonOptions = {};
      if (stateData) {
        if (stateData.currentHp !== undefined) {
          clonedOptions.curHP = stateData.currentHp;
        }

        if (stateData.status) {
          clonedOptions.status = stateData.status;
        }

        if (stateData.boosts) {
          clonedOptions.boosts = stateData.boosts;
        }
      }
      return pokemon.clone(clonedOptions);
    };

    // Build player party from playerParty state
    const playerPartyPokemon: Pokemon[] = [];
    for (const pokemonId of playerParty) {
      const parsed = parsePokemonId(pokemonId);
      if (!parsed) continue;

      const { species, setName } = parsed;
      const set = playerState.availableSets[species]?.[setName];
      if (!set) continue;

      const pokemon = new Pokemon(gen, species, {
        level: set.level,
        ability: set.ability,
        abilityOn: true,
        item: set.item || "",
        nature: set.nature,
        ivs: convertIVsFromCustomSetToPokemon(set.ivs),
        evs: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
        moves: set.moves,
      });

      const statefulPokemon = applyPokemonState(pokemon, pokemonId, 'player');
      playerPartyPokemon.push(statefulPokemon);
    }

    let selectedPlayerPokemon = playerPartyPokemon.find(p => p.species.name === playerSelection.species);
    const selectedPlayerPokemonId = getPokemonId(playerSelection.species, playerSelection.setName);
    if (!selectedPlayerPokemon) {
      // If selected Pokemon is not in party, create it from the selection
      const selectedSet = playerState.availableSets[playerSelection.species]?.[playerSelection.setName];
      if (!selectedSet) {
        return undefined;
      }

      const pokemon = new Pokemon(gen, playerSelection.species, {
        level: selectedSet.level,
        ability: selectedSet.ability,
        abilityOn: true,
        item: selectedSet.item || "",
        nature: selectedSet.nature,
        ivs: convertIVsFromCustomSetToPokemon(selectedSet.ivs),
        evs: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
        moves: selectedSet.moves,
      });

      
      selectedPlayerPokemon = applyPokemonState(pokemon, selectedPlayerPokemonId, 'player');

      // Set party to empty when selected Pokemon is not in party
      playerPartyPokemon.splice(0);
    } else {
      // If selected Pokemon is in party, remove it from party
      popFromParty(playerPartyPokemon, selectedPlayerPokemon);
    }

    // Build CPU party from trainer
    const trainerName = getTrainerNameByTrainerIndex(trainerState.currentTrainerIndex);
    const selectedCpuPokemonId = getPokemonId(cpuSelection.species, trainerName);
    const cpuTrainerParty = OpposingTrainer(trainerName).map(p => {
      return applyPokemonState(p.clone(), selectedCpuPokemonId, 'cpu');
    });

    const cpuActive = cpuTrainerParty.find(p =>
      getPokemonId(p.species.name, trainerName) === selectedCpuPokemonId
    );

    if (!cpuActive) {
      return undefined;
    }
    popFromParty(cpuTrainerParty, cpuActive);

    const playerTrainer = new PlayerTrainer([new PokemonPosition(selectedPlayerPokemon, pokemonStates.player[selectedPlayerPokemonId]?.firstTurnOut)], playerPartyPokemon);
    const cpuTrainer = new CpuTrainer(trainerName, [new PokemonPosition(cpuActive, pokemonStates.cpu[selectedCpuPokemonId]?.firstTurnOut)], cpuTrainerParty);

    // Create field with configured state from Redux
    const field = new Field({
      terrain: fieldState.terrain,
      weather: fieldState.weather,
      isTrickRoom: fieldState.isTrickRoom,
      attackerSide: {
        isLightScreen: fieldState.playerSide.isLightScreen,
        isReflect: fieldState.playerSide.isReflect,
        isAuroraVeil: fieldState.playerSide.isAuroraVeil,
        isTailwind: fieldState.playerSide.isTailwind,
        isSR: fieldState.playerSide.isSR,
        spikes: fieldState.playerSide.spikes,
      },
      defenderSide: {
        isLightScreen: fieldState.cpuSide.isLightScreen,
        isReflect: fieldState.cpuSide.isReflect,
        isAuroraVeil: fieldState.cpuSide.isAuroraVeil,
        isTailwind: fieldState.cpuSide.isTailwind,
        isSR: fieldState.cpuSide.isSR,
        spikes: fieldState.cpuSide.spikes,
      },
    });

    // Create BattleFieldState
    return new BattleFieldState(playerTrainer, cpuTrainer, field, 0);
  }
);
