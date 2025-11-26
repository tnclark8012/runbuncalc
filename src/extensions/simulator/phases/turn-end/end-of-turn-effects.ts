import { ActivePokemon, BattleFieldState, PokemonPosition } from "../../moveScoring.contracts";
import { applyBoost, damagePokemonWithPercentageOfMaxHp } from "../../utils";
import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";

export function applyEndOfTurnEffects(state: BattleFieldState): BattleFieldState {
  state = state.clone();

  visitActivePokemonInSpeedOrder(state, {
    visitActivePokemon(state, pokemon, field) {
      state = applyEndOfTurnEffect(state, pokemon);
    },
  });

  return state;
}

type Participant  = { self: PokemonPosition, ally?: PokemonPosition, opponents?: PokemonPosition[] };
export function applyEndOfTurnEffect(state: BattleFieldState, pokemon: PokemonPosition): BattleFieldState {
  state = state.clone();
  let participant: Participant;
  if (state.player.getActivePokemon(pokemon.pokemon)) {
    participant = { self: pokemon, ally: state.player.active.find(p => !p.pokemon.equals(pokemon.pokemon)), opponents: state.cpu.active };
  }
  else {
    participant = { self: pokemon, ally: state.cpu.active.find(p => !p.pokemon.equals(pokemon.pokemon)), opponents: state.player.active };
  }
    
  applyEffectToField(participant.self, state);
  applyEffectToSelf(participant.self, participant.opponents!);
  participant.opponents?.forEach(opponent => applyEffectToTarget(participant.self, opponent));
  return state;
}

function applyEffectToSelf(source: ActivePokemon, opponents: ActivePokemon[]): void {
  switch(source.pokemon.status) {
    case 'brn':
      damagePokemonWithPercentageOfMaxHp(source.pokemon, 1/16);
      break;
    case 'psn':
      damagePokemonWithPercentageOfMaxHp(source.pokemon, 1/8);
      break;
    case 'tox':
      damagePokemonWithPercentageOfMaxHp(source.pokemon, source.pokemon.toxicCounter/16);
      source.pokemon.toxicCounter++;
      break;
  }
}

function applyEffectToTarget(source: ActivePokemon, target: ActivePokemon): void {
  
}

function applyEffectToField(source: ActivePokemon, state: BattleFieldState): void {
  
}