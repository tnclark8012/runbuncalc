/**
 * Hook to compute possible next battle states from a selected captured state
 */

import { Field, Pokemon } from '@smogon/calc';
import { PokemonOptions } from '@smogon/calc/dist/pokemon';
import { ItemName } from '@smogon/calc/src/data/interface';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { gen, PlannedPlayerActionProvider, PlannedSwitchAction, PlannedTrainerAction, usingHeuristics } from '../../configuration';
import { getPokemonId } from '../../core/storage';
import { CustomSets } from '../../core/storage.contracts';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../simulator/moveScoring.contracts';
import { popFromParty } from '../../simulator/phases/switching/execute-switch';
import { PossibleBattleFieldState, runTurn } from '../../simulator/turn-state';
import { convertIVsFromCustomSetToPokemon } from '../../simulator/utils';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../../trainer-sets';
import { parsePokemonId } from '../party';
import { CapturedBattleStateData, PlannedTrainerActionState } from '../store/capturedBattleStateSlice';
import { RootState } from '../store/store';

/**
 * Reconstruct a BattleFieldState from a CapturedBattleStateData
 */
function reconstructBattleFieldState(
  capturedState: CapturedBattleStateData,
  availablePlayerSets: CustomSets,
): BattleFieldState | undefined {
  const { party, trainerIndex, pokemonStates, fieldState, turnNumber } = capturedState;

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

      if (stateData.item !== undefined) {
        clonedOptions.item = (stateData.item || "") as ItemName;
      }
    }
    return pokemon.clone(clonedOptions);
  };

  // Build player party from captured party state
  const playerPartyPokemon: Pokemon[] = [];
  for (const pokemonId of party.playerParty) {
    const parsed = parsePokemonId(pokemonId);
    if (!parsed) continue;

    const { species, setName } = parsed;
    const set = availablePlayerSets[species]?.[setName];
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

  if (playerPartyPokemon.length === 0) {
    return undefined;
  }

  // First pokemon in party is the active one
  const playerActive = playerPartyPokemon[0];
  popFromParty(playerPartyPokemon, playerActive);

  // Build CPU party from trainer
  const trainerName = getTrainerNameByTrainerIndex(trainerIndex);
  const cpuTrainerParty = OpposingTrainer(trainerName).map(p => {
    const pokemonId = getPokemonId(p.species.name, trainerName);
    return applyPokemonState(p.clone(), pokemonId, 'cpu');
  });

  if (cpuTrainerParty.length === 0) {
    return undefined;
  }

  const cpuActive = cpuTrainerParty[0];
  popFromParty(cpuTrainerParty, cpuActive);

  const playerTrainer = new PlayerTrainer([new PokemonPosition(playerActive, true)], playerPartyPokemon);
  const cpuTrainer = new CpuTrainer(trainerName, [new PokemonPosition(cpuActive, true)], cpuTrainerParty);

  // Create field with captured state
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

  // Create BattleFieldState with the captured turn number
  return new BattleFieldState(playerTrainer, cpuTrainer, field, turnNumber - 1);
}

function runTurnWithPlannedAction(state: BattleFieldState, plannedAction: PlannedTrainerActionState): PossibleBattleFieldState[] {

  const plannedActions: PlannedTrainerAction[] = [];
  if (plannedAction.type === 'switch') {
    const actingPokemon = state.player.party.find(p => p.species.name === plannedAction.pokemonSpecies);
    plannedActions.push({
      pokemon: actingPokemon,
      type: 'switch',
    } as PlannedSwitchAction);
  }
  else {
    const actingPokemon = state.player.active.find(p => p.pokemon.species.name === plannedAction.pokemonSpecies)?.pokemon;
    plannedActions.push({
      type: 'move',
      move: plannedAction.move,
      pokemon: actingPokemon!,
    });
  }

  let paddedPlannedActions = Array(state.turnNumber + 1).fill([]) as PlannedTrainerAction[][];
  paddedPlannedActions[state.turnNumber] = plannedActions;
  let results = usingHeuristics({
    playerActionProvider: new PlannedPlayerActionProvider(paddedPlannedActions)
  }, () => {
    return runTurn(state);
  });

  console.log('Results from planned action:', results);

  return results || [];
}

/**
 * Hook that returns possible next battle states for the selected captured state
 */
export function usePossibleStates(): PossibleBattleFieldState[] {
  const [possibleStates, setPossibleStates] = useState<PossibleBattleFieldState[]>([]);

  const selectedStateIndex = useSelector((state: RootState) => state.capturedBattleState.selectedStateIndex);
  const capturedStates = useSelector((state: RootState) => state.capturedBattleState.capturedStates);
  const availablePlayerSets = useSelector((state: RootState) => state.set.player.availableSets);
  const availableCpuSets = useSelector((state: RootState) => state.set.cpu.availableSets);

  useEffect(() => {
    if (selectedStateIndex === null || selectedStateIndex >= capturedStates.length) {
      setPossibleStates([]);
      return;
    }

    const selectedState = capturedStates[selectedStateIndex];
    const battleFieldState = reconstructBattleFieldState(
      selectedState,
      availablePlayerSets,
    );

    if (!battleFieldState) {
      setPossibleStates([]);
      return;
    }

    // Run turn simulation
    try {
      const results = runTurnWithPlannedAction(battleFieldState, selectedState.plannedPlayerAction!);
      // Sort by probability, highest first
      const sorted = results.sort((a, b) => b.probability - a.probability);
      setPossibleStates(sorted);
    } catch (error) {
      console.error('Error running turn simulation:', error);
      setPossibleStates([]);
    }
  }, [selectedStateIndex, capturedStates, availablePlayerSets, availableCpuSets]);

  return possibleStates;
}
