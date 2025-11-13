import { MoveScore } from "../../moveScore";
import { calculateAllMoves, findHighestDamageMove, scoreCPUMoves, getDamageRanges } from "../../moveScoring";
import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { PossibleAction, ScoredPossibleAction, TargetSlot } from "./move-selection.contracts";
import { gen } from "../../../configuration";

export function getCpuPossibleActions(state: BattleFieldState, cpuPokemon: ActivePokemon, playerActive: ActivePokemon[], cpuActive: ActivePokemon[]): PossibleAction[] {
    let actions: ScoredPossibleAction[] = [];
    let topScore = -Infinity;
    for (let targetSlot = 0; targetSlot < playerActive.length; targetSlot++) {
        let target = playerActive[targetSlot];
        let actionsAgainstTarget = getCpuPossibleActionsAgainstTarget(state, cpuPokemon, target, { type: 'opponent', slot: targetSlot });
        if (!actionsAgainstTarget.length)
            continue;
        
        let batchScore = actionsAgainstTarget[0].score;
        if (batchScore > topScore) {
            topScore = batchScore;
            actions = actionsAgainstTarget;
        }
        else if (batchScore === topScore) {
            actions.push(...actionsAgainstTarget);
        }
    }

    return actions;
}

export function getCpuMoveScoresAgainstTarget(state: BattleFieldState, cpuPokemon: ActivePokemon, target: ActivePokemon, targetSlot: TargetSlot): Array<MoveScore> {
    let playerDamageResults = calculateAllMoves(gen, target.pokemon, cpuPokemon.pokemon, state.playerField);
    let cpuDamageResults = calculateAllMoves(gen, cpuPokemon.pokemon, target.pokemon, state.cpuField);
    let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
    let moveScores = scoreCPUMoves(cpuDamageResults, cpuAssumedPlayerMove, state.cpuField, /*lastTurnMoveByCpuPokemon*/ undefined);
    return moveScores;
}

function getCpuPossibleActionsAgainstTarget(state: BattleFieldState, cpuPokemon: ActivePokemon, target: ActivePokemon, targetSlot: TargetSlot): Array<ScoredPossibleAction> {
    const highestScoringCpuMoves = calculateCpuMove(getCpuMoveScoresAgainstTarget(state, cpuPokemon, target, targetSlot));
    return highestScoringCpuMoves.map<ScoredPossibleAction>((cpuMove: MoveScore) => {
        return ({
            type: 'move',
            pokemon: cpuPokemon.pokemon,
            move: {
                move: cpuMove.move.move,
                target: targetSlot
            },
            probability: 1 / highestScoringCpuMoves.length,
            score: cpuMove.finalScore
        } as ScoredPossibleAction);
    });
}

function calculateCpuMove(moveScores: MoveScore[]): MoveScore[] {
    let highestScoringMoves: MoveScore[] = [];
    for (let score of moveScores) {
        let soFar = highestScoringMoves[highestScoringMoves.length - 1];
        if (!soFar) {
            highestScoringMoves.push(score);
            continue;
        }

        if (score.finalScore > soFar.finalScore) {
            highestScoringMoves = [score];
        }
        else if (score.finalScore === soFar.finalScore) {
            highestScoringMoves.push(score);
        }
    }

    return highestScoringMoves;
}