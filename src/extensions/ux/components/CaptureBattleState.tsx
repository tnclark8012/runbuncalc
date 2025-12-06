/**
 * Component for capturing the current battle state
 */

import { Button } from '@fluentui/react-components';
import { Field, Pokemon } from '@smogon/calc';
import { PokemonOptions } from '@smogon/calc/dist/pokemon';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { gen } from '../../configuration';
import { getPokemonId } from '../../core/storage';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../simulator/moveScoring.contracts';
import { popFromParty } from '../../simulator/phases/switching/execute-switch';
import { convertIVsFromCustomSetToPokemon } from '../../simulator/utils';
import { getTrainerNameByTrainerIndex, OpposingTrainer } from '../../trainer-sets';
import { parsePokemonId } from '../party';
import { RootState } from '../store/store';

/**
 * Component that provides a button to capture the current battle state
 */
export const CaptureBattleState: React.FC = () => {
  const playerState = useSelector((state: RootState) => state.set.player);
  const cpuState = useSelector((state: RootState) => state.set.cpu);
  const { playerParty } = useSelector((state: RootState) => state.party);
  const { currentTrainerIndex } = useSelector((state: RootState) => state.trainer);
  const pokemonStates = useSelector((state: RootState) => state.pokemonState);

  const handleCapture = React.useCallback(() => {
    const cpuSelection = cpuState.selection;
    const playerSelection = playerState.selection;
    if (!playerSelection || !cpuSelection)
      return;

    // Helper to apply Pokemon state from Redux
    const applyPokemonState = (pokemon: Pokemon, pokemonId: string, side: 'player' | 'cpu') => {
      const state = side === 'player'
        ? pokemonStates.player[pokemonId]
        : pokemonStates.cpu[pokemonId];

      const clonedOptions: PokemonOptions = {};
      if (state) {
        // Apply current HP
        if (state.currentHp !== undefined) {
          clonedOptions.curHP = state.currentHp;
        }

        // Apply status
        if (state.status) {
          clonedOptions.status = state.status;
        }

        // Apply boosts
        if (state.boosts) {
          clonedOptions.boosts = state.boosts;
        }
      }
      return pokemon.clone(clonedOptions);
    };

    // Build player party from playerParty state
    const playerPartyPokemon: Pokemon[] = [];
    for (const pokemonId of playerParty) {
      const { species, setName } = parsePokemonId(pokemonId)!;
      const set = playerState.availableSets[species]?.[setName];
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

    const playerActive = playerPartyPokemon.find(p => p.species.name === playerSelection.species)!;
    popFromParty(playerPartyPokemon, playerActive);

    // Build CPU party from trainer
    const trainerName = getTrainerNameByTrainerIndex(currentTrainerIndex);
    const cpuTrainerParty = OpposingTrainer(trainerName).map(p => {
      const pokemonId = getPokemonId(p.species.name, trainerName);
      return applyPokemonState(p.clone(), pokemonId, 'cpu');
    });

    const cpuActive = cpuTrainerParty.find(p => getPokemonId(p.species.name, trainerName) === getPokemonId(cpuSelection.species, cpuSelection.setName))!;
    popFromParty(cpuTrainerParty, cpuActive);

    const playerTrainer = new PlayerTrainer([new PokemonPosition(playerActive, true)], playerPartyPokemon);
    const cpuTrainer = new CpuTrainer(trainerName, [new PokemonPosition(cpuActive, true)], cpuTrainerParty);

    // Create field (default field for now)
    const field = new Field();

    // Create BattleFieldState
    const battleState = new BattleFieldState(playerTrainer, cpuTrainer, field, 0);

    // Log to console
    console.log('Captured BattleFieldState:');
    console.log(battleState);
    console.log(battleState.toString());

  }, [playerState, cpuState, playerParty, currentTrainerIndex, pokemonStates]);

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      <Button appearance="primary" onClick={handleCapture}>
        Capture Battle State
      </Button>
    </div>
  );
};
