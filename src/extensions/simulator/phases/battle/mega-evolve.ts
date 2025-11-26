import { Pokemon } from "@smogon/calc";
import { PokemonReplacer, visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { canMegaEvolve, isMegaEvolution, isMegaEvolutionOf } from "../../moveScoring";
import { BattleFieldState, PokemonPosition } from "../../moveScoring.contracts";
import { applyStartOfTurnAbility } from "../turn-start/start-of-turn-abilities";
import { ActionLogEntry, isMoveAction, MoveAction, PossibleTrainerAction } from "./move-selection.contracts";

type MegaEvolutionToApply = { baseForm: PokemonPosition, mega: Pokemon };

export function executeMegaEvolution(state: BattleFieldState, actions: PossibleTrainerAction[]): { outcome: BattleFieldState, log: ActionLogEntry[] } {
    let moves = actions.filter(trainerAction => isMoveAction(trainerAction.action) && isMegaEvolution(trainerAction.action.pokemon));
    let megasToApply: MegaEvolutionToApply[] = [];
    visitActivePokemonInSpeedOrder(state, {
        visitActivePokemon(state, pokemon) {
            if (canMegaEvolve(pokemon.pokemon)) {
                let megaAction = moves.find(possibleAction => isMoveAction(possibleAction.action) && isMegaEvolutionOf(pokemon.pokemon, possibleAction.action.pokemon));
                if (megaAction) {
                    megasToApply.push({ baseForm: pokemon, mega: (megaAction.action as MoveAction).pokemon });
                }
            }
        }
    });

    let log: ActionLogEntry[] = [];
    for (let mega of megasToApply) {
        let result = applyMegaEvolution(state, mega);
        state = result.outcome;
    }

    return { outcome: state, log };
}

function applyMegaEvolution(state: BattleFieldState, mega: MegaEvolutionToApply): { outcome: BattleFieldState, log: string[] } {
    let newState = state.clone();
    let log: string[] = [];
    newState = PokemonReplacer.replace(newState, mega.baseForm.pokemon, mega.mega);
    log.push(`${mega.baseForm.pokemon.name} mega evolved into ${mega.mega.name}!`);
    applyStartOfTurnAbility(newState, new PokemonPosition(mega.mega, mega.baseForm.firstTurnOut));
    return { outcome: newState, log };
}