import { calculate, Field, Move, Pokemon, Result } from "@smogon/calc";
import { PokemonReplacer, visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { ActivePokemon, BattleFieldState, MoveResult, Trainer } from "../../moveScoring.contracts";
import { PossibleBattleFieldState } from "../../turn-state";
import { PossibleAction, PossibleTrainerAction, TargetedMove, TargetSlot, SwitchAction, MoveAction } from "./move-selection.contracts";
import { MoveScore } from "../../moveScore";
import { getCpuPossibleActions } from "./cpu-move-selection";
import { getPlayerPossibleActions } from "./player-move-selection";
import { executeSwitch } from "../switching/execute-switch";
import { cpuRng, gen, playerRng } from "../../../configuration";
import { executeMove } from "./execute-move";
import { toMoveResult } from "../../moveScoring";
import { TrainerActionPokemonReplacer } from "../../possible-trainer-action-visitor";

export function determineMoveOrderAndExecute(state: BattleFieldState): PossibleBattleFieldState[] {
    if (state.player.active.every(ap => ap.pokemon.curHP() <= 0) || state.cpu.active.every(ap => ap.pokemon.curHP() <= 0)) {
        return []; // No valid moves if all Pokémon are fainted
    }

    let results: PossibleBattleFieldState[] = [];
    const allPossibleTurns: PossibleTrainerAction[][] = getAllPlayerAndCpuPossibleTurns(state);
    for (const combination of allPossibleTurns) {
        let newState = state.clone();

        // Separate actions by type
        const switches = combination.filter(a => a.action.type === 'switch');

        for (let switchAction of switches) {
            newState = executeSwitch(newState, switchAction.trainer, switchAction.action as SwitchAction);
        }

        // const megas = combination.filter(a => a.action.type === 'mega');
        const moves = combination.filter(a => a.action.type === 'move');

        // // Sort switches and megas by speed order
        // switches.sort((a, b) => a.pokemon.pokemon.stats.spe - b.pokemon.pokemon.stats.spe);
        // // megas.sort((a, b) => b.pokemon.stats.spe - a.pokemon.stats.spe);

        // Sort moves by priority, then speed order for ties
        moves.sort((a, b) => {
            let moveA = a.action as MoveAction;
            let moveB = b.action as MoveAction;
            if (moveA.move.move.priority !== moveB.move.move.priority) return moveB.move.move.priority - moveA.move.move.priority;
            return b.pokemon.pokemon.stats.spe - a.pokemon.pokemon.stats.spe;
        });

        for (let moveAction of moves) {
            let actor = getPokemon(newState, moveAction);
            if (actor.pokemon.curHP() <= 0) {
                continue; // Skip if the Pokémon has fainted earlier in the turn
            }

            let updatedAction = TrainerActionPokemonReplacer.replace(moveAction, actor.pokemon);
            let executionResult = executeMoveOnState(newState,  updatedAction.trainer, updatedAction.action as MoveAction);
            newState = executionResult;
        }
        
        let outcome = newState;
        results.push({ 
            type: 'possible', 
            probability: combination.reduce((acc, action) => acc * action.action.probability, 1),
            state: outcome, 
            history: [...switches, ...moves].map(a => toHistoryEntry(a)) 
        });
    }

    return results;
}

function toHistoryEntry(action: PossibleTrainerAction): string {
    if (action.action.type === 'move') {
        return `${action.trainer.name}'s ${action.pokemon.pokemon.name} used ${action.action.move.move.name} on slot ${action.action.move.target.slot}`;
    } else if (action.action.type === 'switch') {
        return `${action.trainer.name} switched in ${action.action.switchIn?.name || 'an unknown Pokémon'} for ${action.pokemon.pokemon.name}`;
    }
    throw new Error('Unknown action type');
}
function getPokemon(state: BattleFieldState, action: PossibleTrainerAction): ActivePokemon {
    if (action.trainer.equals(state.player))
        return state.player.getActivePokemon(action.pokemon.pokemon)!;
    return state.cpu.getActivePokemon(action.pokemon.pokemon)!;
}

export function getAllPlayerAndCpuPossibleTurns(state: BattleFieldState): PossibleTrainerAction[][] {
    // One entry per pokemon on the field
    let possibleActionsByPokemon: PossibleTrainerAction[][] = getPossibleActionsForAllSlots(state);


    // Now, we need to determine move order based on speed and execute the moves accordingly.
    // First, we'll flatten the possible actions into a list of all combinations of possibilities for a turn
    // Then, we'll iterate through and execute the actions in the correct order: switches (speed order), megas (not implemented) (speed order), attacks (priority order, then speed order for ties. if speed tied, we'll execute both possibilities).
    // Flatten all possible actions into combinations for the turn
    let allPossibleTurns: PossibleTrainerAction[][] = generateAllActionCombinations(possibleActionsByPokemon);
    return allPossibleTurns;
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
export function generateAllActionCombinations(possibleActionsByPokemon: PossibleTrainerAction[][]): PossibleTrainerAction[][] {
    // Generate all combinations, preserving which Pokémon is performing which action
    // Each PossiblePokemonActions: { pokemon, possibleActions }
    // Cartesian product of these arrays
    return cartesianProduct(possibleActionsByPokemon);
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

function getPossibleActionsForAllSlots(state: BattleFieldState): Array<PossibleTrainerAction[]> {
    let possibleActionsByPokemon: Array<PossibleTrainerAction[]> = [];
    for (let i = 0; i < state.cpu.active.length; i++) {
        let possibleActions: PossibleAction[] = getCpuPossibleActions(state, state.cpu.active[i], state.player.active, state.cpu.active);
        possibleActionsByPokemon.push(possibleActions.map<PossibleTrainerAction>(action => ({
            pokemon: state.cpu.active[i],
            action,
            slot: { slot: i },
            trainer: state.cpu
        })));
    }

    let cpuPossibleActions = [...possibleActionsByPokemon];
    for (let i = 0; i < state.player.active.length; i++) {
        let possibleActions: PossibleAction[] = getPlayerPossibleActions(state, state.player.active[i], state.cpu.active);
         possibleActionsByPokemon.push(possibleActions.map<PossibleTrainerAction>(action => ({
            pokemon: state.player.active[i],
            action,
            slot: { slot: i },
            trainer: state.player
        })));
    }

    return possibleActionsByPokemon;
}

function executeMoveOnState(state: BattleFieldState, trainer: Trainer, action: MoveAction): BattleFieldState {
    let newState = state.clone();

    let target = action.move.target;
    let targetActive = trainer.name === "Player" ? newState.cpu.active[target.slot] : newState.player.active[target.slot];
    let actingPokemon = trainer.getActivePokemon(action.pokemon)!.pokemon;
    let calcResult = calculate(gen, actingPokemon, targetActive.pokemon, action.move.move, trainer.name === "Player" ? state.playerField : state.cpuField);
    let moveResult = toMoveResult(calcResult);
    let executionResult = executeMove(gen, action.pokemon, targetActive.pokemon, moveResult, trainer.name === "Player" ? playerRng : cpuRng);
    let impactOnAttacker = PokemonReplacer.replace(newState, executionResult.attacker);
    let endingState = PokemonReplacer.replace(impactOnAttacker, executionResult.defender);
    let description = `${actingPokemon.name} used ${action.move.move.name} on ${targetActive.pokemon.name} (${targetActive.pokemon.curHP()}/${targetActive.pokemon.maxHP()})`;
    console.log(description);
    return endingState;
}