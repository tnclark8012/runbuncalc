import { Field, Move, Pokemon, Result } from "@smogon/calc";
import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { ActivePokemon, BattleFieldState, MoveResult } from "../../moveScoring.contracts";
import { PossibleBattleFieldState } from "../../turn-state";
import { getCpuPossibleMoves } from "./cpu-move-selection";
import { PossibleAction, PossiblePokemonAction, PossiblePokemonActions, TargetedMove, TargetSlot } from "./move-selection.contracts";
import { calculateAllMoves, findHighestDamageMove, getDamageRanges, scoreCPUMoves } from "../../moveScoring";
import { MoveScore } from "../../moveScore";

export function determineMoveOrderAndExecute(state: BattleFieldState): PossibleBattleFieldState[] {
    // One entry per pokemon on the field
    let possibleActionsByPokemon: PossiblePokemonActions[] = getPossibleActionsForAllSlots(state);


    // Now, we need to determine move order based on speed and execute the moves accordingly.
    // First, we'll flatten the possible actions into a list of all combinations of possibilities for a turn
    // Then, we'll iterate through and execute the actions in the correct order: switches (speed order), megas (not implemented) (speed order), attacks (priority order, then speed order for ties. if speed tied, we'll execute both possibilities).
    // Flatten all possible actions into combinations for the turn
    let allPossibleTurns: PossiblePokemonAction[][] = generateAllActionCombinations(possibleActionsByPokemon);

    let results: PossibleBattleFieldState[] = [];

    for (const combination of allPossibleTurns) {
        // Separate actions by type
        const switches = combination.filter(a => a.action.action.type === 'switch');
        // const megas = combination.filter(a => a.action.type === 'mega');
        const moves = combination.filter(a => a.action.action.type === 'move');

        // // Sort switches and megas by speed order
        // switches.sort((a, b) => a.pokemon.pokemon.stats.spe - b.pokemon.pokemon.stats.spe);
        // // megas.sort((a, b) => b.pokemon.stats.spe - a.pokemon.stats.spe);

        // // Sort moves by priority, then speed order for ties
        // moves.sort((a, b) => {
        //     if (a.action.action..priority !== b.action.priority) return b.action.priority - a.action.priority;
        //     return b.pokemon.stats.spe - a.pokemon.stats.spe;
        // });

        // Execute switches
        // let stateAfterSwitches = executeActions(state, switches);

        // Execute megas (not implemented, so just pass through)
        // let stateAfterMegas = executeActions(stateAfterSwitches, megas);

        // Execute attacks
        // let finalState = executeActions(stateAfterMegas, attacks);

        results.push({ type: 'possible', probability: 1 / allPossibleTurns.length, state: state.clone() });
    }

    return results;
}

/**
 * Generates all possible combinations of actions for the turn.
 * 
 * For example (conceptually), if there are 2 pokemon, each with 2 possible actions, this will return 4 combinations:
 * [{ pokemon: p1, actions: [p1a1, p1a2] }, { pokemon: p2, actions: [p2a1, p2a2] }]
 * will return
 * 
 * [
 *  { pokemon: p1, action: p1a1 }, { pokemon: p2, action: p2a1 },
 * { pokemon: p1, action: p1a1 }, { pokemon: p2, action: p2a2 },
 * { pokemon: p1, action: p1a2 }, { pokemon: p2, action: p2a1 },
 * { pokemon: p1, action: p1a2 }, { pokemon: p2, action: p2a2 },
 * ]
 * 
 * @param possibleActionsByPokemon An array of up to 4 elements -- one for each pokemon on the field. Each entry will contain all possible actions
 * that pokemon might take on the turn.
 * @returns An array of all possible combinations of actions for the turn. Each element will be an array the same size of possibleActionsByPokemon
 */
export function generateAllActionCombinations(possibleActionsByPokemon: PossiblePokemonActions[]): PossiblePokemonAction[][] {
    // Generate all combinations, preserving which Pokémon is performing which action
    // Each PossiblePokemonActions: { pokemon, possibleActions }
    const actionArrays: PossiblePokemonAction[][] = possibleActionsByPokemon.map(p => p.possibleActions.map(action => ({ pokemon: p.pokemon, action })));
    // Cartesian product of these arrays
    return cartesianProduct(actionArrays);
}

// Simple cartesian product implementation
function cartesianProduct(arrays: any[][]): any[][] {
    return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
}

// Executes a list of actions on the state (stub, to be implemented)
function executeActions(state: BattleFieldState, actions: PossibleAction[]): BattleFieldState {
    // Apply each action to the state (actual logic to be implemented)
    let newState = state.clone();
    for (const action of actions) {
        // TODO: Implement action execution logic
    }
    return newState;
}

function getPossibleActionsForAllSlots(state: BattleFieldState): Array<PossiblePokemonActions> {
    let possibleActionsByPokemon: Array<PossiblePokemonActions> = [];
    for (let i = 0; i < state.cpuActive.length; i++) {
        let possibleActions: PossibleAction[] = getCpuPossibleActions(state, state.cpuActive[i], state.playerActive, state.cpuActive);
        possibleActionsByPokemon.push({ pokemon: state.cpuActive[i], possibleActions });
    }

    for (let i = 0; i < state.playerActive.length; i++) {
        let possibleActions: PossibleAction[] = getPlayerPossibleActions(state);
        possibleActionsByPokemon.push({ pokemon: state.playerActive[i], possibleActions });
    }

    return possibleActionsByPokemon;
}

export function getPlayerPossibleActions(state: BattleFieldState): PossibleAction[] {
    // TODO - implement player possible actions
    return [];
}

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

type ScoredPossibleAction = PossibleAction & { score: number };
function getCpuPossibleActionsAgainstTarget(state: BattleFieldState, cpuPokemon: ActivePokemon, target: ActivePokemon, targetSlot: TargetSlot): Array<ScoredPossibleAction> {
    let playerDamageResults = calculateAllMoves(gen, target.pokemon, cpuPokemon.pokemon, state.playerField);
    let cpuDamageResults = calculateAllMoves(gen, cpuPokemon.pokemon, target.pokemon, state.cpuField);
    let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
    let highestScoringCpuMoves = calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove, state.cpuField, /* lastTurnMoveByCPU -- not yet implemented */undefined);

    return highestScoringCpuMoves.map((cpuMove: MoveScore) => {
        return ({
            action: { type: 'move', move: { move: cpuMove.move.move, target: targetSlot } }, // TODO - status, protect, etc target self?
            probability: 1/highestScoringCpuMoves.length,
            score: cpuMove.finalScore
        });
    });
}

function calculateCpuMove(cpuResults: Result[], playerMove: MoveResult, cpuField: Field, lastTurnMoveByCpuPokemon: Move | undefined): MoveScore[] {
    let moveScores = scoreCPUMoves(cpuResults, playerMove, cpuField, lastTurnMoveByCpuPokemon);

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