import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { applyBoost } from "../../utils";

export function applyStartOfTurnAbilities(state: BattleFieldState): BattleFieldState {
  state = state.clone();
  let participants = [
    { source: state.player.active[0], ally: state.player.active[1] },
    { source: state.player.active[1], ally: state.player.active[0], opponents: state.cpu.active },
    { source: state.cpu.active[0], ally: state.cpu.active[1], opponents: state.player.active },
    { source: state.cpu.active[1], ally: state.cpu.active[0], opponents: state.player.active }
  ].filter(x => !!x.source);

  // Abilities trigger in speed order
  participants.sort((a, b) => a.source.pokemon.stats.spe - b.source.pokemon.stats.spe);
  
  for (let participant of participants) {
    if (participant.source.pokemon.hasItem('Eject Pack')) {
      throw new Error("Eject Pack not implemented in start-of-turn abilities");
    }
    
    applyAbilityToField(participant.source, state);
    applyAbilityToSelf(participant.source, participant.opponents!);
    participant.opponents?.forEach(opponent => applyAbilityToTarget(participant.source, opponent));
  }

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