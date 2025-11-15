import { BattleFieldState } from "./moveScoring.contracts";
import { applyPlayerSwitchIns, applyCpuSwitchIns } from "./phases/switching";
import { applyStartOfTurnAbilities } from "./phases/turn-start/start-of-turn-abilities";
import { applyFieldHazards } from "./phases/turn-start/field-hazards";
import { determineMoveOrderAndExecute } from "./phases/battle/determine-move-order-and-execute";
import { ActionLogEntry } from "./phases/battle/move-selection.contracts";

export type PossibleBattleFieldState = { type: 'possible', probability: number, state: BattleFieldState, history: ActionLogEntry[] };
export type BattleFieldStateTransform = (state: BattleFieldState) => BattleFieldState | BattleFieldState[] | PossibleBattleFieldState[];

export function applyTransforms(state: BattleFieldState, transforms: BattleFieldStateTransform[]): PossibleBattleFieldState[] {
    let statesToExplore: PossibleBattleFieldState[] = [{ type: 'possible', probability: 1, state, history: [] }];
    
    for (const phase of transforms) {
        statesToExplore = statesToExplore.flatMap(possibleState => {
            let result = phase(possibleState.state);
            if (!Array.isArray(result))
                result = [result];
            return result.map<PossibleBattleFieldState>(r => isPossibleState(r) ? r : { type: 'possible', probability: 1, state: r, history: [...possibleState.history] })
            .map(r => ({ ...r, probability: r.probability * possibleState.probability, history: [...possibleState.history, ...r.history] }));
        });
    }

    return statesToExplore;
}

function isPossibleState(state: BattleFieldState | PossibleBattleFieldState): state is PossibleBattleFieldState {
    return (state as PossibleBattleFieldState).type === 'possible';
}

export function runTurn(state: BattleFieldState): PossibleBattleFieldState[] {

    let nextState = state.clone();
    nextState.turnNumber++;
    const transforms: BattleFieldStateTransform[] = [
        applyPlayerSwitchIns,
        applyCpuSwitchIns,
        applyFieldHazards,
        applyStartOfTurnAbilities,
        determineMoveOrderAndExecute,
        // applyEndOfTurnEffects,
        // applyEndOfTurnAbilities,
    ];

    let turnEnd = applyTransforms(nextState, transforms);
    return turnEnd;
}

function applyAbilities(state: BattleFieldState): BattleFieldState {
    return state;
}
