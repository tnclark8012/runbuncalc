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
        
        // Find the maximum score among all actions against this target
        let batchScore = Math.max(...actionsAgainstTarget.map(a => a.score));
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
    const moveScores = getCpuMoveScoresAgainstTarget(state, cpuPokemon, target, targetSlot);
    const moveProbabilities = calculateCpuMove(moveScores);
    
    return moveProbabilities.map<ScoredPossibleAction>((moveProb) => {
        return ({
            type: 'move',
            pokemon: cpuPokemon.pokemon,
            move: {
                move: moveProb.moveScore.move.move,
                target: targetSlot
            },
            probability: moveProb.probability,
            score: moveProb.score
        } as ScoredPossibleAction);
    });
}

interface MoveProbability {
    moveScore: MoveScore;
    probability: number;
    score: number;
}

function calculateCpuMove(moveScores: MoveScore[]): MoveProbability[] {
    // For each move, get all possible score outcomes
    const moveOutcomes = moveScores.map(moveScore => ({
        moveScore,
        scores: moveScore.getScores()
    }));
    
    // Check if all moves have single outcomes (common case, fast path)
    const allSingleOutcome = moveOutcomes.every(mo => mo.scores.length === 1);
    if (allSingleOutcome) {
        // Fast path: use simple comparison like the original code
        let highestScoringMoves: MoveProbability[] = [];
        let highestScore = -Infinity;
        
        for (const outcome of moveOutcomes) {
            const score = outcome.scores[0].modifier;
            
            if (score > highestScore) {
                highestScore = score;
                highestScoringMoves = [{
                    moveScore: outcome.moveScore,
                    probability: 1,
                    score: score
                }];
            } else if (score === highestScore) {
                highestScoringMoves.push({
                    moveScore: outcome.moveScore,
                    probability: 1,
                    score: score
                });
            }
        }
        
        // Distribute probability equally among tied moves
        const prob = 1 / highestScoringMoves.length;
        return highestScoringMoves.map(m => ({ ...m, probability: prob }));
    }
    
    // Slow path: handle multiple outcomes per move
    // Map to track the probability each move is the highest
    const moveProbabilities = new Map<MoveScore, number>();
    const moveMaxScores = new Map<MoveScore, number>();
    
    // Initialize probabilities to 0
    for (const move of moveScores) {
        moveProbabilities.set(move, 0);
        moveMaxScores.set(move, -Infinity);
    }
    
    // Generate all possible combinations of score outcomes
    // For each combination, determine which move(s) have the highest score
    function evaluateAllCombinations(index: number, currentScores: Map<MoveScore, number>, currentProbability: number) {
        // Early termination: if probability is negligible, skip
        if (currentProbability < 0.0001) {
            return;
        }
        
        if (index === moveOutcomes.length) {
            // Find the highest score in this combination
            let maxScore = -Infinity;
            for (const score of currentScores.values()) {
                maxScore = Math.max(maxScore, score);
            }
            
            // Find all moves with the max score (ties)
            const movesWithMaxScore: MoveScore[] = [];
            for (const [move, score] of currentScores.entries()) {
                if (score === maxScore) {
                    movesWithMaxScore.push(move);
                    // Track the maximum score this move can achieve
                    moveMaxScores.set(move, Math.max(moveMaxScores.get(move)!, score));
                }
            }
            
            // Distribute probability among tied moves
            const probPerMove = currentProbability / movesWithMaxScore.length;
            for (const move of movesWithMaxScore) {
                moveProbabilities.set(move, moveProbabilities.get(move)! + probPerMove);
            }
            return;
        }
        
        // Recursively try each possible score for the current move
        const outcome = moveOutcomes[index];
        for (const scoreModifier of outcome.scores) {
            const newScores = new Map(currentScores);
            newScores.set(outcome.moveScore, scoreModifier.modifier);
            evaluateAllCombinations(
                index + 1,
                newScores,
                currentProbability * scoreModifier.percentChance
            );
        }
    }
    
    evaluateAllCombinations(0, new Map(), 1);
    
    // Return only moves that have a non-zero probability of being highest
    const result: MoveProbability[] = [];
    for (const [moveScore, probability] of moveProbabilities.entries()) {
        if (probability > 0.001) {  // Use higher threshold to filter out negligible probabilities
            result.push({
                moveScore,
                probability,
                score: moveMaxScores.get(moveScore)!
            });
        }
    }
    
    return result;
}