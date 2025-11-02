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