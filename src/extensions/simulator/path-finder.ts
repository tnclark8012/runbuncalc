import { BattleFieldState } from "./moveScoring.contracts";
import { runTurn } from "./turn-state";

export function findPlayerWinningPath(state: BattleFieldState): BattleFieldState[] | null {
    return findPath(state, (s) => 
        s.cpu.active.every(p => p.pokemon.curHP() === 0) && 
        s.cpu.party.every(p => p.curHP() === 0) &&
        s.player.active.every(p => p.pokemon.curHP() > 0) &&
        s.player.party.every(p => p.curHP() > 0));
}

export function findPath(state: BattleFieldState, isGoalState: (state: BattleFieldState) => boolean): BattleFieldState[] | null {
    let visited = new Set<string>();
    let queue: { state: BattleFieldState, path: BattleFieldState[] }[] = [{ state, path: [state] }];

    while (queue.length > 0) {
        let current = queue.shift()!;
        let stateKey = current.state.toString(); // Simplistic state representation for visited check

        if (visited.has(stateKey)) {
            continue;
        }

        visited.add(stateKey);

        if (isGoalState(current.state)) {
            return current.path;
        }

        let possibleStates = runTurn(current.state);
        // Here you would generate possible next states from the current state
        let nextStates: BattleFieldState[] = possibleStates.map(ps => ps.state);

        for (let nextState of nextStates) {
            queue.push({ state: nextState, path: [...current.path, nextState] });
        }
    }

    return null; // No path found
}