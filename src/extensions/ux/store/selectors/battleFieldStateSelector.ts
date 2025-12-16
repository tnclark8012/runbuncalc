import { Field, Pokemon } from '@smogon/calc';
import { PokemonOptions } from '@smogon/calc/dist/pokemon';
import { gen } from '../../../configuration';
import { getPokemonId } from '../../../core/storage';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../../simulator/moveScoring.contracts';
import { popFromParty } from '../../../simulator/phases/switching/execute-switch';
import { convertIVsFromCustomSetToPokemon } from '../../../simulator/utils';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../../../trainer-sets';
import { parsePokemonId } from '../../party';
import { RootState } from '../store';

/**
 * Creates a BattleFieldState from the current Redux state
 * Returns undefined if the required selections are not present
 */
export const selectBattleFieldState = (state: RootState): BattleFieldState | undefined => {
  const playerState = state.set.player;
  const cpuState = state.set.cpu;
  const { playerParty } = state.party;
  const { currentTrainerIndex } = state.trainer;
  const pokemonStates = state.pokemonState;
  const fieldState = state.field;

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

  let playerActive = playerPartyPokemon.find(p => p.species.name === playerSelection.species);
  
  if (!playerActive) {
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
    
    const pokemonId = getPokemonId(playerSelection.species, playerSelection.setName);
    playerActive = applyPokemonState(pokemon, pokemonId, 'player');
    
    // Set party to empty when selected Pokemon is not in party
    playerPartyPokemon.splice(0);
  } else {
    // If selected Pokemon is in party, remove it from party
    popFromParty(playerPartyPokemon, playerActive);
  }

  // Build CPU party from trainer
  const trainerName = getTrainerNameByTrainerIndex(currentTrainerIndex);
  const cpuTrainerParty = OpposingTrainer(trainerName).map(p => {
    const pokemonId = getPokemonId(p.species.name, trainerName);
    return applyPokemonState(p.clone(), pokemonId, 'cpu');
  });

  const cpuActive = cpuTrainerParty.find(p => 
    getPokemonId(p.species.name, trainerName) === getPokemonId(cpuSelection.species, cpuSelection.setName)
  );

  if (!cpuActive) {
    return undefined;
  }
  popFromParty(cpuTrainerParty, cpuActive);

  const playerTrainer = new PlayerTrainer([new PokemonPosition(playerActive, true)], playerPartyPokemon);
  const cpuTrainer = new CpuTrainer(trainerName, [new PokemonPosition(cpuActive, true)], cpuTrainerParty);

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
};
