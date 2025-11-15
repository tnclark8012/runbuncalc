import { BattleFieldState } from "./moveScoring.contracts";
import { ActionLogEntry } from "./phases/battle/move-selection.contracts";
import { PossibleBattleFieldState, runTurn } from "./turn-state";

export interface DecisionNode {
    state: PossibleBattleFieldState;
    playerAction: string;
    // Map from CPU outcome to the next decision node
    cpuOutcomes: Map<string, DecisionNode | 'WIN'>;
}

export function findPlayerWinningPath(state: BattleFieldState): DecisionNode | null {
    return findPathGuaranteed(state, (s) => {
        const allCpuPokemonFainted = s.cpu.active.every(ap => ap.pokemon.curHP() <= 0) && s.cpu.party.every(pp => pp.curHP() <= 0);
        const allPlayerPokemonAlive = s.player.active.every(ap => ap.pokemon.curHP() > 0) && s.player.party.every(pp => pp.curHP() > 0);
        if (allCpuPokemonFainted)
            return allPlayerPokemonAlive;
        if (!allPlayerPokemonAlive)
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

export function findPathGuaranteed(state: BattleFieldState, isGoalState: (state: BattleFieldState) => boolean | undefined): DecisionNode | null {
    let memo = new Map<string, DecisionNode | 'WIN' | 'LOSS'>();
    
    function search(current: PossibleBattleFieldState, depth: number): DecisionNode | 'WIN' | 'LOSS' {
        // Prevent infinite loops
        if (depth > 20) {
            return 'LOSS';
        }
        
        let stateKey = toStateKey(current);
        
        // Check memoized result
        if (memo.has(stateKey)) {
            return memo.get(stateKey)!;
        }

        // Mark as being explored (to detect cycles)
        memo.set(stateKey, 'LOSS');

        // Check if we've reached the goal
        let goalCheck = isGoalState(current.state);
        if (goalCheck !== undefined) {
            const result = goalCheck ? 'WIN' : 'LOSS';
            memo.set(stateKey, result);
            return result;
        }

        // Get all possible outcomes for this turn
        let possibleOutcomes = runTurn(current.state);
        
        // Group outcomes by player action
        let actionGroups = groupByPlayerAction(possibleOutcomes);
        
        // Try each player action
        for (let [playerAction, outcomes] of actionGroups) {
            // For this player action to guarantee a win, ALL possible CPU responses must lead to a win
            let allPathsWin = true;
            let cpuOutcomes = new Map<string, DecisionNode | 'WIN'>();
            
            for (let outcome of outcomes) {
                let subResult = search(outcome, depth + 1);
                
                if (subResult === 'LOSS') {
                    // This CPU response doesn't lead to a win, so this player action doesn't guarantee a win
                    allPathsWin = false;
                    break;
                }
                
                // Store the decision tree for this CPU outcome
                let cpuActionKey = getCpuActionFromHistory(outcome.history);
                cpuOutcomes.set(cpuActionKey, subResult);
            }
            
            // If all CPU responses lead to a win, we found a guaranteed winning player action
            if (allPathsWin) {
                const decisionNode: DecisionNode = {
                    state: current,
                    playerAction,
                    cpuOutcomes
                };
                memo.set(stateKey, decisionNode);
                return decisionNode;
            }
        }
        
        // No guaranteed winning action found
        memo.set(stateKey, 'LOSS');
        return 'LOSS';
    }
    
    const result = search({ type: 'possible', history: [], probability: 1, state: state}, 0);
    return result === 'WIN' || result === 'LOSS' ? null : result;
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

function getPlayerActionFromHistory(history: ActionLogEntry[]): string {
    let playerActions = history.filter(h => h.action.trainer.name === 'Player');
    return playerActions[playerActions.length - 1]?.description || 'No Player action';
}

function getCpuActionFromHistory(history: ActionLogEntry[]): string {
    let cpuActions = history.filter(h => h.action.trainer.name !== 'Player');
    return cpuActions[cpuActions.length - 1]?.description || 'No CPU action';
}

function toStateKey(state: PossibleBattleFieldState): string {
    // Create a unique string representation of the state for visited checks
    return state.state.toString();
}

export function printDecisionTree(tree: DecisionNode | null, indent: string = ''): string {
    if (!tree) {
        return indent + 'No winning path found';
    }
    
    let output = '';
    
    // Print the player action
    output += indent + tree.playerAction + '\n';
    
    // Get CPU outcomes
    const outcomes = Array.from(tree.cpuOutcomes.entries());
    
    if (outcomes.length === 0) {
        return output;
    }
    
    // If there's only one CPU outcome, don't use if/else
    if (outcomes.length === 1) {
        const [cpuAction, nextNode] = outcomes[0];
        output += indent + cpuAction + '\n';
        
        if (nextNode === 'WIN') {
            output += indent + 'WIN\n';
        } else {
            output += printDecisionTree(nextNode, indent);
        }
    } else {
        // Multiple CPU outcomes - use if/else branching
        // Calculate probabilities (assume equal probability for now)
        const probability = (100 / outcomes.length).toFixed(1);
        
        outcomes.forEach(([cpuAction, nextNode], index) => {
            if (index === 0) {
                output += indent + `if ${cpuAction} (${probability}%):\n`;
            } else {
                output += indent + `else ${cpuAction} (${probability}%):\n`;
            }
            
            if (nextNode === 'WIN') {
                output += indent + '  WIN\n';
            } else {
                output += printDecisionTree(nextNode, indent + '  ');
            }
        });
    }
    
    return output;
}