import { BattleFieldState } from "./moveScoring.contracts";
import { PossibleBattleFieldState, runTurn } from "./turn-state";

export function findPlayerWinningPath(state: BattleFieldState): PossibleBattleFieldState[] | null {
    return findPath(state, (s) => 
        s.cpu.active.every(p => p.pokemon.curHP() === 0) && 
        s.cpu.party.every(p => p.curHP() === 0) &&
        s.player.active.every(p => p.pokemon.curHP() > 0) &&
        s.player.party.every(p => p.curHP() > 0));
}

export function findPath(state: BattleFieldState, isGoalState: (state: BattleFieldState) => boolean): PossibleBattleFieldState[] | null {
    let visited = new Set<string>();
    let queue: { state: PossibleBattleFieldState, path: PossibleBattleFieldState[] }[] = [{ 
        state: { history: [], probability: 1, state, type: 'possible'}, 
        path: [{ history: [], probability: 1, state, type: 'possible'}] }];

    while (queue.length > 0) {
        let current = queue.shift()!;
        let stateKey = toStateKey(current.state); // Simplistic state representation for visited check

        if (visited.has(stateKey)) {
            continue;
        }

        visited.add(stateKey);

        if (isGoalState(current.state.state)) {
            return current.path;
        }

        let possibleStates = runTurn(current.state.state);
        let nextStates = possibleStates;

        for (let nextState of nextStates) {
            queue.push({ state: nextState, path: [...current.path, nextState] });
        }
    }

    return null; // No path found
}

function toStateKey(state: PossibleBattleFieldState): string {
    // Create a unique string representation of the state for visited checks
    return state.state.toString();
}