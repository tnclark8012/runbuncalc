import { BattleFieldState } from "./moveScoring.contracts";
import { applyPlayerSwitchIns, applyCpuSwitchIns } from "./phases/switching";
import { applyStartOfTurnAbilities } from "./phases/turn-start/start-of-turn-abilities";
import { applyFieldHazards } from "./phases/turn-start/field-hazards";

export type BattleFieldStateTransform = (state: BattleFieldState) => BattleFieldState | BattleFieldState[];

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
        applyFieldHazards,
        applyStartOfTurnAbilities,
    ];

    return applyTransforms(state, transforms);
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
