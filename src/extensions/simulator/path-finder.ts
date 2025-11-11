import { BattleFieldState } from "./moveScoring.contracts";
import { PossibleBattleFieldState, runTurn } from "./turn-state";

export function findPlayerWinningPath(state: BattleFieldState): PossibleBattleFieldState[] | null {
    return findPathGuaranteed(state, (s) => {
        const allCpuPokemonFainted = s.cpu.active.every(ap => ap.pokemon.curHP() <= 0) && s.cpu.party.every(pp => pp.curHP() <= 0);
        const anyPlayerPokemonFainted = !s.player.active.every(ap => ap.pokemon.curHP() >= 0) && !s.player.party.every(pp => pp.curHP() >= 0);
        if (allCpuPokemonFainted)
            return !anyPlayerPokemonFainted;
        if (anyPlayerPokemonFainted)
            return false;

        return undefined;
    });
}

export function findPath(state: BattleFieldState, isGoalState: (state: BattleFieldState) => boolean | undefined): PossibleBattleFieldState[] | null {
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

export function findPathGuaranteed(state: BattleFieldState, isGoalState: (state: BattleFieldState) => boolean | undefined): PossibleBattleFieldState[] | null {
    let visited = new Map<string, boolean | undefined>();
    
    function search(current: PossibleBattleFieldState, path: PossibleBattleFieldState[], depth: number): PossibleBattleFieldState[] | null {
        // Prevent infinite loops
        if (depth > 20) return null;
        
        let stateKey = toStateKey(current);
        if (visited.has(stateKey) && visited.get(stateKey) !== undefined) {
            return visited.get(stateKey) ? path : null;
        }

        visited.set(stateKey, undefined);

        // Check if we've reached the goal
        let goalCheck = isGoalState(current.state);
        if (goalCheck !== undefined) {
            visited.set(stateKey, goalCheck);
            return goalCheck ? path : null;
        }

        // Get all possible outcomes for this turn
        let possibleOutcomes = runTurn(current.state);
        
        // Group outcomes by player action
        let actionGroups = groupByPlayerAction(possibleOutcomes);
        
        // Try each player action
        for (let [playerAction, outcomes] of actionGroups) {
            // For this player action to guarantee a win, ALL possible CPU responses must lead to a win
            let allPathsWin = true;
            let longestWinningPath: PossibleBattleFieldState[] | null = null;
            
            for (let outcome of outcomes) {
                let subPath = search(outcome, [...path, outcome], depth + 1);
                
                if (subPath === null) {
                    // This CPU response doesn't lead to a win, so this player action doesn't guarantee a win
                    allPathsWin = false;
                    break;
                }
                
                // Track the longest path (in case we want to return the full sequence)
                if (longestWinningPath === null || subPath.length > longestWinningPath.length) {
                    longestWinningPath = subPath;
                }
            }
            
            // If all CPU responses lead to a win, we found a guaranteed winning player action
            if (allPathsWin && longestWinningPath !== null) {
                visited.set(stateKey, true);
                return longestWinningPath;
            }
        }
        
        visited.set(stateKey, false);
        return null;
    }
    
    return search({ type: 'possible', history: [], probability: 1, state: state}, [{ history: [], probability: 1, state, type: 'possible'}], 0);
}

function groupByPlayerAction(outcomes: PossibleBattleFieldState[]): Map<string, PossibleBattleFieldState[]> {
    let groups = new Map<string, PossibleBattleFieldState[]>();
    
    for (let outcome of outcomes) {
        // Extract player action from history (assuming it's encoded in the history)
        // You may need to adjust this based on how your history is structured
        let playerAction = getPlayerActionFromHistory(outcome.history);
        
        if (!groups.has(playerAction)) {
            groups.set(playerAction, []);
        }
        groups.get(playerAction)!.push(outcome);
    }
    
    return groups;
}

function getPlayerActionFromHistory(history: string[]): string {
    let playerActions = history.filter(h => h.startsWith('Player'));
    return playerActions[playerActions.length - 1] || 'unknown';
}

function toStateKey(state: PossibleBattleFieldState): string {
    // Create a unique string representation of the state for visited checks
    return state.state.toString();
}