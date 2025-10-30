import { applyCpuSwitchIns } from "./phases/switching";
import { BattleFieldState } from "./moveScoring.contracts";
import { Field, Move, Pokemon } from '@smogon/calc';
import { applyPlayerSwitchIns } from "./phases/switching";

export function runTurn(state: BattleFieldState): BattleFieldState {
    state = switchInPokemon(state)[0];
    state = applyStartOfTurnEffects(state);
    state = determineMoveOrderAndExecute(state);
    state = applyEndOfTurnEffects(state);
    return state;
}

/**
 * Returns the possible battle field states after applying switch-ins. Player pokemon get switched in before CPU pokemon
 * the CPU switches in slot 1 before slot 2 if they're both empty
 * @param state 
 */
function switchInPokemon(state: BattleFieldState): BattleFieldState[] {
    state = applyCpuSwitchIns(state);
    let states = applyPlayerSwitchIns(state);
    return states;
    // Find indices of playerActive slots that need switch-in (KO'd or empty)
    function getKOdIndices(activeArr: any[]): number[] {
        return activeArr
            .map((p, i) => (!p || (p.pokemon && p.pokemon.curHP && p.pokemon.curHP() <= 0)) ? i : -1)
            .filter(i => i !== -1);
    }

    const playerKOdIndices = getKOdIndices(state.playerActive);
    // If no player switch-ins needed, just do CPU switch-in
    if (playerKOdIndices.length === 0) {
        return [getCpuSwitchIn(state.clone())];
    }

    // Helper to generate all possible switch-in combinations for KO'd slots
    function getSwitchCombos(party: Pokemon[], slots: number[]): Pokemon[][] {
        if (slots.length === 0) return [[]];
        let combos: Pokemon[][] = [];
        for (let i = 0; i < party.length; i++) {
            let remainingParty = party.slice(0, i).concat(party.slice(i + 1));
            let restCombos = getSwitchCombos(remainingParty, slots.slice(1));
            for (let rest of restCombos) {
                combos.push([party[i], ...rest]);
            }
        }
        return combos;
    }

    const switchCombos = getSwitchCombos(state.playerParty, playerKOdIndices);
    const results: BattleFieldState[] = [];

    for (const combo of switchCombos) {
        let newState = state.clone();
        // Switch in each chosen Pokemon to the KO'd slot
        const newPlayerActive = [...newState.playerActive];
        playerKOdIndices.forEach((slotIdx, i) => {
            newPlayerActive[slotIdx] = { pokemon: combo[i], firstTurnOut: true };
        });
        // Remove switched-in Pokemon from party
        const newPlayerParty = newState.playerParty.filter((p: any) => !combo.includes(p));
        // Now, let CPU switch in
        const cpuSwitchedState = getCpuSwitchIn(new BattleFieldState(
            newState.battleFormat,
            newPlayerActive,
            newState.cpuActive,
            newPlayerParty,
            newState.cpuParty,
            newState.playerField,
            newState.cpuField
        ));
        results.push(cpuSwitchedState);
    }
    return results;
}

// Placeholder for CPU switch-in logic
function getCpuSwitchIn(state: BattleFieldState): BattleFieldState {
    // Find indices of cpuActive slots that need switch-in (KO'd or empty)
    function getKOdIndices(activeArr: any[]): number[] {
        return activeArr
            .map((p, i) => (!p || (p.pokemon && p.pokemon.curHP && p.pokemon.curHP() <= 0)) ? i : -1)
            .filter(i => i !== -1);
    }
    const cpuKOdIndices = getKOdIndices(state.cpuActive);
    let newCpuActive = [...state.cpuActive];
    let newCpuParty = [...state.cpuParty];
    for (const slotIdx of cpuKOdIndices) {
        if (newCpuParty.length > 0) {
            newCpuActive[slotIdx] = { pokemon: newCpuParty[0], firstTurnOut: true };
            newCpuParty = newCpuParty.slice(1);
        }
    }
    return new BattleFieldState(
        state.battleFormat,
        state.playerActive,
        newCpuActive,
        state.playerParty,
        newCpuParty,
        state.playerField,
        state.cpuField
    );
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
