import { Field, Move } from "@smogon/calc";
import { Side } from "@smogon/calc/src";
import { cpuRng, Heuristics, playerRng } from "../../../configuration";
import { PokemonPositionReplacer, PokemonReplacer } from "../../battle-field-state-visitor";
import { isTwoTurnMove, makesInvulnerable } from "../../move-properties";
import { BattleFieldState, PokemonPosition, Trainer } from "../../moveScoring.contracts";
import { TrainerActionPokemonReplacer } from "../../possible-trainer-action-visitor";
import { PossibleBattleFieldState } from "../../turn-state";
import { getFinalSpeed, hasBerry } from "../../utils";
import { executeSwitch } from "../switching/execute-switch";
import { getCpuPossibleActions } from "./cpu-move-selection";
import { executeMove } from "./execute-move";
import { executeMegaEvolution } from "./mega-evolve";
import { ActionLogEntry, MoveAction, PossibleAction, PossibleTrainerAction, SwitchAction } from "./move-selection.contracts";
import { getPlayerPossibleActions } from "./player-move-selection";

export function determineMoveOrderAndExecute(state: BattleFieldState): PossibleBattleFieldState[] {
    if (state.player.active.every(ap => ap.pokemon.curHP() <= 0) || state.cpu.active.every(ap => ap.pokemon.curHP() <= 0)) {
        return []; // No valid moves if all Pokémon are fainted
    }

    let results: PossibleBattleFieldState[] = [];
    const allPossibleTurns: PossibleTrainerAction[][] = getAllPlayerAndCpuPossibleTurns(state);
    for (const combination of allPossibleTurns) {
        let newState = state.clone();
        let log: ActionLogEntry[] = [];
        // Separate actions by type
        const switches = combination.filter(a => a.action.type === 'switch').sort((a, b) => {
            let aSpeed = getFinalSpeed(a.pokemon.pokemon, newState.getfield(a.pokemon), newState.getSide(a.pokemon));
            let bSpeed = getFinalSpeed(b.pokemon.pokemon, newState.getfield(b.pokemon), newState.getSide(b.pokemon));
            return aSpeed - bSpeed;
        });

        for (let switchAction of switches) {
            const outcome = executeSwitch(newState, switchAction.trainer, switchAction.action as SwitchAction);
            newState = outcome.outcome;
            log.push({ action: switchAction, description: outcome.description });
        }

        const moves = combination.filter(a => a.action.type === 'move');
        const megasResult = executeMegaEvolution(newState, moves);
        for (let i = 0; i < moves.length; i++) {
            moves[i] = TrainerActionPokemonReplacer.replace(moves[i], moves[i].pokemon.pokemon, (moves[i].action as MoveAction).pokemon);
        }

        newState = megasResult.outcome;
        log.push(...megasResult.log);

        // Sort moves by priority, then speed order for ties
        const sortMovesByExecutionOrder = () => {
            return moves.sort((a, b) => {
                let moveA = a.action as MoveAction;
                let moveB = b.action as MoveAction;
                if (moveA.move.move.priority !== moveB.move.move.priority) return moveB.move.move.priority - moveA.move.move.priority;
                let aSpeed = getFinalSpeed(a.pokemon.pokemon, newState.getfield(a.pokemon), newState.getSide(a.pokemon));
                let bSpeed = getFinalSpeed(b.pokemon.pokemon, newState.getfield(b.pokemon), newState.getSide(b.pokemon));
                return bSpeed - aSpeed;
            });
        };

        let moveAction: PossibleTrainerAction | undefined;
        // Dynamic speed
        while (moveAction = sortMovesByExecutionOrder().shift()) {
            let actor = getPokemon(newState, moveAction);
            if (actor.pokemon.curHP() <= 0) {
                continue; // Skip if the Pokémon has fainted earlier in the turn
            }

            let updatedAction = TrainerActionPokemonReplacer.replace(moveAction, actor.pokemon);
            if (actor.volatileStatus?.flinched) {
                delete actor.volatileStatus.flinched;
                log.push({ action: updatedAction, description: `${actor} flinched and couldn't move!` });
            }
            else {
                let executionResult = executeMoveOnState(newState,  newState.getTrainer(updatedAction.trainer), updatedAction.action as MoveAction);
                newState = executionResult.outcome;
                log.push(...executionResult.log);
            }
        }
        
        let outcome = newState;
        results.push({ 
            type: 'possible', 
            probability: combination.reduce((acc, action) => acc * action.action.probability, 1),
            state: outcome, 
            history: log
        });
    }

    return results;
}

function getPokemon(state: BattleFieldState, action: PossibleTrainerAction): PokemonPosition {
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
        let possibleActions: PossibleAction[] = getCpuPossibleActions(state, state.cpu.active[i]);
        possibleActionsByPokemon.push(possibleActions.map<PossibleTrainerAction>(action => ({
            pokemon: state.cpu.active[i],
            action,
            slot: { slot: i },
            trainer: state.cpu
        })));
    }

    let cpuPossibleActions = [...possibleActionsByPokemon];
    let plannedPlayerActions = Heuristics.playerActionProvider?.getPossibleActions(state);
    if (plannedPlayerActions) {
        possibleActionsByPokemon.push(...plannedPlayerActions);
    }
    else {
        possibleActionsByPokemon.push(...getPlayerPossibleActions(state));
    }

    return possibleActionsByPokemon;
}

function executeMoveOnState(state: BattleFieldState, trainer: Trainer, action: MoveAction): { outcome: BattleFieldState, log: ActionLogEntry[]} {
    let newState = state.clone();

    let target = action.move.target;
    let targetActive = trainer.name === "Player" ? newState.cpu.active[target.slot] : newState.player.active[target.slot];
    let actingPosition = trainer.getActivePokemon(action.pokemon);
    let actingPokemon = actingPosition!.pokemon;
    const moveName = action.move.move.name;
    
    // Check if this is a two-turn move
    if (isTwoTurnMove(moveName)) {
        // Check if we're on turn 1 (charging) or turn 2 (executing)
        const isCharging = !actingPosition!.volatileStatus?.chargingMove;
        
        if (isCharging && !actingPokemon.hasItem('Power Herb')) {
            // Turn 1: Set up charging state, no damage
            const updatedPosition = new PokemonPosition(
                actingPokemon.clone(),
                actingPosition!.firstTurnOut,
                {
                    chargingMove: moveName,
                    invulnerable: makesInvulnerable(moveName),
                    turnsRemaining: 1
                }
            );

            newState = PokemonPositionReplacer.replace(newState, actingPosition!, updatedPosition);
            
            const description = `${trainer.name}'s ${actingPosition} began charging ${moveName}!`;
            return { 
                outcome: newState, 
                log: [{ 
                    action: { trainer, pokemon: actingPosition!, action: { ...action, probability: -1 }, slot: { slot: target.slot }}, 
                    description 
                }] 
            };
        } else {
            // Turn 2: Execute the move and clear volatile status
            const updatedPosition = new PokemonPosition(
                actingPokemon.clone({ item: actingPokemon.item === 'Power Herb' ? undefined : actingPokemon.item }),
                actingPosition!.firstTurnOut,
                undefined // Clear volatile status
            );
            
            // Replace the Pokemon position in state before calculating
            newState = PokemonPositionReplacer.replace(newState, updatedPosition);
        }
    }
    
    // Check if target is invulnerable
    if (targetActive.volatileStatus?.invulnerable) {
        const description = `${trainer.name}'s ${actingPosition} used ${moveName}, but ${targetActive.pokemon.name} avoided it!`;
        return { 
            outcome: newState, 
            log: [{ 
                action: { trainer, pokemon: actingPosition!, action: { ...action, probability: -1 }, slot: { slot: target.slot }}, 
                description 
            }] 
        };
    }

    // Normal move execution
    // TODO: Refactor to support dynamic speed similarly, or unburden
    let defenderHadBerry = hasBerry(targetActive.pokemon);
    const isPlayer = trainer.name === "Player";
    let executionResult = executeMove(action.pokemon, targetActive.pokemon, action.move.move, isPlayer ? state.playerField : state.cpuField, isPlayer ? playerRng : cpuRng);
    newState = PokemonReplacer.replace(newState, executionResult.attacker);
    newState = PokemonReplacer.replace(newState, executionResult.defender);
    let defenderPosition = newState.getOpponent(trainer).getActivePokemon(executionResult.defender)!;
    if (defenderHadBerry && !hasBerry(executionResult.defender)) {
        defenderPosition.volatileStatus = {
            ...defenderPosition.volatileStatus,
            berryConsumed: true
        };
    }
    if (action.move.move.name === 'Fake Out') {
        defenderPosition.volatileStatus = {
            ...defenderPosition.volatileStatus,
            flinched: true
        };
    }

    let description = (() => {
        let targetInitialHp = `${targetActive.pokemon.curHP()}/${targetActive.pokemon.maxHP()}`;
        let targetEndingHp = `${executionResult.defender.curHP()}/${executionResult.defender.maxHP()}`;
        let moveDescription = action.move.move.isCrit ? `a CRIT ${action.move.move.name}` : action.move.move.name;
        return `${trainer.name}'s ${actingPosition} (${actingPokemon.curHP()}/${actingPokemon.maxHP()}) used ${moveDescription} on ${targetActive} (${targetInitialHp} -> ${targetEndingHp})`;
    })();
    if (trainer.name === "Player") {
        applyFieldEffects(newState.field, newState.playerSide, newState.cpuSide, action.move.move);
    }
    else {
        applyFieldEffects(newState.field, newState.cpuSide, newState.playerSide, action.move.move);
    }
    return { outcome: newState, log: [{ action: { trainer, pokemon: actingPosition!, action: { ...action, probability: -1 }, slot: { slot: target.slot }}, description }] };
}

function applyFieldEffects(field: Field, attackerSide: Side, defenderSide: Side, move: Move): void {
    switch(move.name) {
        case 'Stealth Rock':
            defenderSide.isSR = true;
            break;
        case 'Spikes':
            defenderSide.spikes = (defenderSide.spikes || 0) + 1;
            break;
    }
}