import { Generations, Result } from "@smogon/calc";
import { ActivePokemon, ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { PossibleTargetedMove, TargetedMove } from "./move-selection.contracts";

const gen = Generations.get(8);
export function scoreCpuMoves(playerDamageResults: Result[]): number {
    let cpuDamageResults = calculateAllMoves(gen, this.currentTurnState.cpuActive[0].pokemon, this.currentTurnState.playerActive[0].pokemon, this.currentTurnState.cpuField);
    let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
    let cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove).move;
}

export function getCpuPossibleMoves(state: BattleFieldState, cpuActive: ActivePokemon, playerActive: ActivePokemon[], cpuActive: ActivePokemon[]): PossibleTargetedMove[] {

}