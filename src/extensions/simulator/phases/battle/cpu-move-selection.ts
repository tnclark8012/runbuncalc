import { MoveScore } from "../../moveScore";
import { calculateAllMoves, findHighestDamageMove, scoreCPUMoves, toMoveResults, getLockedMoveAction } from "../../moveScoring";
import { BattleFieldState, PokemonPosition } from "../../moveScoring.contracts";
import { PossibleAction, ScoredPossibleAction, TargetSlot } from "./move-selection.contracts";
import { gen } from "../../../configuration";

export function getCpuPossibleActions(state: BattleFieldState, cpuPokemon: PokemonPosition, playerActive: PokemonPosition[], cpuActive: PokemonPosition[]): PossibleAction[] {
    let lockedMove = getLockedMoveAction(state, state.cpu, state.cpu.active.indexOf(cpuPokemon));
    if (lockedMove) {
        return [lockedMove.action];
    }
    
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

export function getCpuMoveScoresAgainstTarget(state: BattleFieldState, cpuPokemon: PokemonPosition, target: PokemonPosition, targetSlot: TargetSlot): Array<MoveScore> {
    let playerDamageResults = calculateAllMoves(gen, target.pokemon, cpuPokemon.pokemon, state.playerField);
    let cpuDamageResults = calculateAllMoves(gen, cpuPokemon.pokemon, target.pokemon, state.cpuField);
    let cpuAssumedPlayerMove = findHighestDamageMove(toMoveResults(playerDamageResults));
    let moveScores = scoreCPUMoves(cpuDamageResults, cpuAssumedPlayerMove, state);
    return moveScores;
}

function getCpuPossibleActionsAgainstTarget(state: BattleFieldState, cpuPokemon: PokemonPosition, target: PokemonPosition, targetSlot: TargetSlot): Array<ScoredPossibleAction> {
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
            score: calculateExpectedScore(cpuMove)
        } as ScoredPossibleAction);
    });
}

function calculateCpuMove(moveScores: MoveScore[]): MoveScore[] {
    let highestScoringMoves: MoveScore[] = [];
    let highestExpectedScore = -Infinity;
    
    for (let score of moveScores) {
        const expectedScore = calculateExpectedScore(score);
        
        if (expectedScore > highestExpectedScore) {
            highestExpectedScore = expectedScore;
            highestScoringMoves = [score];
        }
        else if (expectedScore === highestExpectedScore) {
            highestScoringMoves.push(score);
        }
    }

    return highestScoringMoves;
}

function calculateExpectedScore(moveScore: MoveScore): number {
    const scores = moveScore.getScores();
    return scores.reduce((sum, scoreModifier) => {
        return sum + (scoreModifier.modifier * scoreModifier.percentChance);
    }, 0);
}