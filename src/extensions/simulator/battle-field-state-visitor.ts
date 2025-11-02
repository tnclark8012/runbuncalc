import { Field, Side } from "@smogon/calc";
import { ActivePokemon, BattleFieldState } from "./moveScoring.contracts";

export interface IBattleFieldStateVisitor {
    visitActivePokemon?(state: BattleFieldState, pokemon: ActivePokemon, side: Side, field: Field): void;
}

export function visitActivePokemonInSpeedOrder(state: BattleFieldState, visitor: IBattleFieldStateVisitor): void {
    if (!visitor.visitActivePokemon)
        return;

    let toVisit: Array<{ active: ActivePokemon, field: Field, side: Side}> = [];
    for (let active of state.playerActive) {
        toVisit.push({ active, field: state.playerField, side: state.playerField.attackerSide });
    }

    for (let active of state.cpuActive) {
        toVisit.push({ active, field: state.cpuField, side: state.cpuField.attackerSide });
    }

    toVisit.sort((a,b) => b.active.pokemon.stats.spe - a.active.pokemon.stats.spe);

    for (let visit of toVisit)
        visitor.visitActivePokemon(state, visit.active, visit.side, visit.field);
}