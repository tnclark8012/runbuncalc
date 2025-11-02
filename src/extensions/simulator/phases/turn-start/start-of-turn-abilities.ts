import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { applyBoost } from "../../utils";

export function applyStartOfTurnAbilities(state: BattleFieldState): BattleFieldState {
  state = state.clone();
  let participants = [
    { source: state.playerActive[0], ally: state.playerActive[1] },
    { source: state.playerActive[1], ally: state.playerActive[0], opponents: state.cpuActive },
    { source: state.cpuActive[0], ally: state.cpuActive[1], opponents: state.playerActive },
    { source: state.cpuActive[1], ally: state.cpuActive[0], opponents: state.playerActive }
  ].filter(x => !!x.source); 

  // Abilities trigger in speed order
  participants.sort((a, b) => a.source.pokemon.stats.spe - b.source.pokemon.stats.spe);
  
  for (let participant of participants) {
    applyAbilityToSelf(participant.source);
    participant.opponents?.forEach(opponent => applyAbilityToTarget(participant.source, opponent));
    applyAbilityToField(participant.source, state);
  }

  return state;
}

function applyAbilityToSelf(source: ActivePokemon): void {
  
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

    if (target.pokemon.hasAbility('Rattled')) {
      applyBoost(target.pokemon.boosts, 'spe', 1);
    }
  }
}

function applyAbilityToField(source: ActivePokemon, state: BattleFieldState): void {
  if (!source.firstTurnOut)
    return;

  if (source.pokemon.hasAbility('Drought')) {
    state.cpuField.weather = "Sun";
    state.playerField.weather = "Sun";
  }
  else if (source.pokemon.hasAbility('Drizzle')) {
    state.cpuField.weather = "Rain";
    state.playerField.weather = "Rain";
  }
  else if (source.pokemon.hasAbility('Sand Stream')) {
    state.cpuField.weather = "Sand";
    state.playerField.weather = "Sand";
  }
  else if (source.pokemon.hasAbility('Snow Warning')) {
    state.cpuField.weather = "Hail";
    state.playerField.weather = "Hail";
  }
  else if (source.pokemon.hasAbility('Cloud Nine', 'Air Lock')) {
    state.cpuField.weather = undefined;
    state.playerField.weather = undefined;
  }
  else if (source.pokemon.hasAbility('Electric Surge')) {
    state.cpuField.terrain = "Electric";
    state.playerField.terrain = "Electric";
  }
  else if (source.pokemon.hasAbility('Grassy Surge')) {
    state.cpuField.terrain = "Grassy";
    state.playerField.terrain = "Grassy";
  }
  else if (source.pokemon.hasAbility('Misty Surge')) {
    state.cpuField.terrain = "Misty";
    state.playerField.terrain = "Misty";
  }
  else if (source.pokemon.hasAbility('Psychic Surge')) {
    state.cpuField.terrain = "Psychic";
    state.playerField.terrain = "Psychic";
  }
}