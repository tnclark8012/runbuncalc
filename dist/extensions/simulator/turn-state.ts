import { BattleFieldState } from "./moveScoring.contracts";
import { Field, Move, Pokemon } from '@smogon/calc';
import { applyPlayerSwitchIns, applyCpuSwitchIns } from "./phases/switching";

type BattleFieldStateTransform = (state: BattleFieldState) => BattleFieldState | BattleFieldState[];

export function applyTransforms(state: BattleFieldState, transforms: BattleFieldStateTransform[]): BattleFieldState[] {
    let statesToExplore = [state];
    for (const transform of transforms) {
        statesToExplore = statesToExplore.flatMap(transform);
    }
    
    return statesToExplore;
}
export function runTurn(state: BattleFieldState): BattleFieldState[] {
    const transforms: BattleFieldStateTransform[] = [
        applyPlayerSwitchIns,
        applyCpuSwitchIns,
    ];

    return applyTransforms(state, transforms);
}

function applyStartOfTurnEffects(state: BattleFieldState): BattleFieldState {
    // Implementation of start-of-turn effects
    state = applyAbilities(state);
    return state;
}

function determineMoveOrderAndExecute(state: BattleFieldState): BattleFieldState {
    // Implementation of move order determination and execution
    return state;
}

function applyEndOfTurnEffects(state: BattleFieldState): BattleFieldState {
    // Implementation of end-of-turn effects
    return state;
}

export function getActions(state: BattleFieldState): BattleFieldState {
    // Implementation to get actions for the turn
    return state;
}

export function simulateBattleTurn(state: BattleFieldState): BattleFieldState {
    state = getActions(state);
    return state;
}

function applyAbilities(state: BattleFieldState): BattleFieldState {
    return state;
}
