/**
 * Utilities for converting BattleFieldState back to Redux state format
 */

import { getPokemonId } from '../core/storage';
import { BattleFieldState } from '../simulator/moveScoring.contracts';
import { FieldState, SideFieldState } from './store/fieldSlice';
import { PartyState } from './store/partySlice';
import { PokemonStateMap } from './store/pokemonStateSlice';

/**
 * Convert a BattleFieldState to Redux state slices
 */
export function convertBattleFieldStateToRedux(state: BattleFieldState): {
  party: PartyState;
  pokemonStates: { player: PokemonStateMap; cpu: PokemonStateMap };
  fieldState: FieldState;
  turnNumber: number;
} {
  // Build player party array
  const playerParty: string[] = [];
  
  // Add active pokemon first
  for (const active of state.player.active) {
    const pokemonId = getPokemonId(active.pokemon.species.name, active.pokemon.name || 'Default');
    playerParty.push(pokemonId);
  }
  
  // Add bench pokemon
  for (const benched of state.player.party) {
    const pokemonId = getPokemonId(benched.species.name, benched.name || 'Default');
    playerParty.push(pokemonId);
  }

  // Build pokemon state maps
  const playerPokemonStates: PokemonStateMap = {};
  const cpuPokemonStates: PokemonStateMap = {};

  // Player pokemon states
  for (const active of state.player.active) {
    const pokemonId = getPokemonId(active.pokemon.species.name, active.pokemon.name || 'Default');
    playerPokemonStates[pokemonId] = {
      currentHp: active.pokemon.curHP(),
      status: active.pokemon.status || '',
      boosts: active.pokemon.boosts,
      item: active.pokemon.item || null,
    };
  }

  for (const benched of state.player.party) {
    const pokemonId = getPokemonId(benched.species.name, benched.name || 'Default');
    playerPokemonStates[pokemonId] = {
      currentHp: benched.curHP(),
      status: benched.status || '',
      boosts: benched.boosts,
      item: benched.item || null,
    };
  }

  // CPU pokemon states
  const cpuTrainerName = state.cpu.name;
  for (const active of state.cpu.active) {
    const pokemonId = getPokemonId(active.pokemon.species.name, cpuTrainerName);
    cpuPokemonStates[pokemonId] = {
      currentHp: active.pokemon.curHP(),
      status: active.pokemon.status || '',
      boosts: active.pokemon.boosts,
      item: active.pokemon.item || null,
    };
  }

  for (const benched of state.cpu.party) {
    const pokemonId = getPokemonId(benched.species.name, cpuTrainerName);
    cpuPokemonStates[pokemonId] = {
      currentHp: benched.curHP(),
      status: benched.status || '',
      boosts: benched.boosts,
      item: benched.item || null,
    };
  }

  // Convert field state
  const playerSide: SideFieldState = {
    isLightScreen: state.field.attackerSide.isLightScreen || false,
    isReflect: state.field.attackerSide.isReflect || false,
    isAuroraVeil: state.field.attackerSide.isAuroraVeil || false,
    isTailwind: state.field.attackerSide.isTailwind || false,
    isSR: state.field.attackerSide.isSR || false,
    spikes: state.field.attackerSide.spikes || 0,
  };

  const cpuSide: SideFieldState = {
    isLightScreen: state.field.defenderSide.isLightScreen || false,
    isReflect: state.field.defenderSide.isReflect || false,
    isAuroraVeil: state.field.defenderSide.isAuroraVeil || false,
    isTailwind: state.field.defenderSide.isTailwind || false,
    isSR: state.field.defenderSide.isSR || false,
    spikes: state.field.defenderSide.spikes || 0,
  };

  const fieldState: FieldState = {
    terrain: state.field.terrain,
    weather: state.field.weather,
    isTrickRoom: state.field.isTrickRoom || false,
    playerSide,
    cpuSide,
  };

  return {
    party: { playerParty },
    pokemonStates: {
      player: playerPokemonStates,
      cpu: cpuPokemonStates,
    },
    fieldState,
    turnNumber: state.turnNumber,
  };
}
