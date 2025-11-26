import { ActivePokemon, BattleFieldState, PokemonPosition } from "../../moveScoring.contracts";
import { applyBoost } from "../../utils";
import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";

export function applyEndOfTurnAbilities(state: BattleFieldState): BattleFieldState {
  state = state.clone();

  visitActivePokemonInSpeedOrder(state, {
    visitActivePokemon(state, pokemon, field) {
      state = applyEndOfTurnAbility(state, pokemon);
    },
  });

  return state;
}

type Participant  = { self: PokemonPosition, ally?: PokemonPosition, opponents?: PokemonPosition[] };
export function applyEndOfTurnAbility(state: BattleFieldState, pokemon: PokemonPosition): BattleFieldState {
  state = state.clone();
  let participant: Participant;
  if (state.player.getActivePokemon(pokemon.pokemon)) {
    participant = { self: pokemon, ally: state.player.active.find(p => !p.pokemon.equals(pokemon.pokemon)), opponents: state.cpu.active };
  }
  else {
    participant = { self: pokemon, ally: state.cpu.active.find(p => !p.pokemon.equals(pokemon.pokemon)), opponents: state.player.active };
  }
    
  applyAbilityToField(participant.self, state);
  applyAbilityToSelf(participant.self, participant.opponents!);
  participant.opponents?.forEach(opponent => applyAbilityToTarget(participant.self, opponent));
  return state;
}

/*
Stat Changes:
Speed Boost - Raises Speed by 1 stage
Moody - Raises one random stat by 2 stages and lowers another by 1 stage
Healing/Recovery:
Dry Skin - Recovers 1/8 HP in Rain
Rain Dish - Recovers 1/16 HP in Rain
Ice Body - Recovers 1/16 HP in Hail/Snow
Poison Heal - Recovers 1/8 HP when poisoned (instead of taking damage)
Regeneration - Recovers 1/3 HP when switching out (not end of turn, but worth noting)
Damage (to self):
Solar Power - Takes 1/8 HP damage in Sun (but boosts Special Attack)
Dry Skin - Takes 1/8 HP damage in Sun
Status Curing:
Shed Skin - 30% chance to cure status condition
Hydration - Cures status conditions in Rain
Other:
Harvest - May recycle consumed Berry
Pickup - May pick up items
Healer - May cure ally's status in doubles
Bad Dreams - Damages sleeping opponents
Schooling / Shields Down / Power Construct - Form changes based on HP
 */

function applyAbilityToSelf(source: ActivePokemon, opponents: ActivePokemon[]): void {
  if (source.pokemon.hasAbility('SpeedBoost')) {
    applyBoost(source.pokemon.boosts, 'spe', 1);
  }
}

function applyAbilityToTarget(source: ActivePokemon, target: ActivePokemon): void {
  
}

function applyAbilityToField(source: ActivePokemon, state: BattleFieldState): void {
  
}