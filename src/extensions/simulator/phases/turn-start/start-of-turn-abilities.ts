import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { ActivePokemon, BattleFieldState, PokemonPosition } from "../../moveScoring.contracts";
import { applyBoost } from "../../utils";

export function applyStartOfTurnAbilities(state: BattleFieldState): BattleFieldState {
  let nextState = state.clone();

  visitActivePokemonInSpeedOrder(state, {
    visitActivePokemon(state, pokemon, field) {
      nextState = applyStartOfTurnAbility(nextState, pokemon);
    },
  });

  return nextState;
}

type Participant  = { self: PokemonPosition, ally?: PokemonPosition, opponents?: PokemonPosition[] };
export function applyStartOfTurnAbility(state: BattleFieldState, pokemon: PokemonPosition): BattleFieldState {
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

function applyAbilityToSelf(source: ActivePokemon, opponents: ActivePokemon[]): void {
  if (!source.firstTurnOut)
    return;

    if (source.pokemon.hasAbility('Download')) {
      // Calculate average Defense and Special Defense
      const avgDef = opponents.reduce((sum, curr) => sum + curr.pokemon.stats.def, 0) / opponents.length;
      const avgSpd = opponents.reduce((sum, curr) => sum + curr.pokemon.stats.spd, 0) / opponents.length;
      if (avgSpd <= avgDef) {
        applyBoost(source.pokemon.boosts, 'spa', 1);
      } else {
        applyBoost(source.pokemon.boosts, 'atk', 1);
      }
    }
}

function applyAbilityToTarget(source: ActivePokemon, target: ActivePokemon): void {
  if (source.pokemon.hasAbility('Intimidate') && source.firstTurnOut) {
    source.pokemon.abilityOn = false;
    if (target.pokemon.hasAbility('Defiant', 'Competitive')) {
      applyBoost(target.pokemon.boosts, 'atk', 2);
    }
    else if (target.pokemon.hasAbility('Contrary')) {
      applyBoost(target.pokemon.boosts, 'atk', 1);
    }
    else if (!target.pokemon.hasAbility('Clear Body', 'Hyper Cutter', 'Inner Focus', 'Oblivious', 'Scrappy', 'White Smoke')) {
      applyBoost(target.pokemon.boosts, 'atk', -1);
    }
  }
}

function applyAbilityToField(source: ActivePokemon, state: BattleFieldState): void {
  if (!source.firstTurnOut)
    return;

  if (source.pokemon.hasAbility('Drought')) {
    state.field.weather = "Sun";
  }
  else if (source.pokemon.hasAbility('Drizzle')) {
    state.field.weather = "Rain";
  }
  else if (source.pokemon.hasAbility('Sand Stream')) {
    state.field.weather = "Sand";
  }
  else if (source.pokemon.hasAbility('Snow Warning')) {
    state.field.weather = "Hail";
  }
  else if (source.pokemon.hasAbility('Cloud Nine', 'Air Lock')) {
    state.field.weather = undefined;
  }
  else if (source.pokemon.hasAbility('Electric Surge')) {
    state.field.terrain = "Electric";
  }
  else if (source.pokemon.hasAbility('Grassy Surge')) {
    state.field.terrain = "Grassy";
  }
  else if (source.pokemon.hasAbility('Misty Surge')) {
    state.field.terrain = "Misty";
  }
  else if (source.pokemon.hasAbility('Psychic Surge')) {
    state.field.terrain = "Psychic";
  }
}