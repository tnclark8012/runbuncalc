import { Generations, Pokemon } from "@smogon/calc";
import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { calculateAllMoves, findHighestDamageMove, getCpuMoveConsiderations, getDamageRanges } from "../../moveScoring";
import { isFainted } from "../../utils";

const generation = Generations.get(8);

export interface CPUSwitchConsideration {
    pokemon: Pokemon;
    aiIsFaster: boolean;
    aiOHKOs: boolean;
    playerOHKOs: boolean;
    aiOutdamagesPlayer: boolean;
}

export function applyPlayerSwitchIns(state: BattleFieldState): BattleFieldState[] {
    state = initializeActivePokemon(state);
    
    // Find all fainted active Pokemon positions
    const faintedPositions: number[] = [];
    for (let i = 0; i < state.playerActive.length; i++) {
        if (isFainted(state.playerActive[i].pokemon)) {
            faintedPositions.push(i);
        }
    }
    
    // If no fainted Pokemon, return original state
    if (faintedPositions.length === 0) {
        return [state];
    }
    
    // Get all non-fainted Pokemon from party
    const availableSwitchIns = state.playerParty.filter(pokemon => !isFainted(pokemon));
    
    // If no available switch-ins, return original state
    if (availableSwitchIns.length === 0) {
        return [state];
    }
    
    // Generate all possible combinations
    const combinations = generateCombinations(availableSwitchIns, faintedPositions.length);
    const futureStates: BattleFieldState[] = [];
    
    for (const combination of combinations) {
        const newState = state.clone();
        
        // Replace fainted Pokemon with switch-ins
        for (let i = 0; i < faintedPositions.length; i++) {
            const position = faintedPositions[i];
            const switchInPokemon = combination[i];
            
            // Get the fainted Pokemon to move to party
            const faintedPokemon = newState.playerActive[position].pokemon;
            
            // Remove switch-in from party
            const switchInIndex = newState.playerParty.findIndex((p: Pokemon) => p.equals(switchInPokemon));
            newState.playerParty.splice(switchInIndex, 1);
            
            // Replace active Pokemon
            newState.playerActive[position] = { 
                pokemon: switchInPokemon, 
                firstTurnOut: true 
            };
            
            // Add fainted Pokemon to end of party
            newState.playerParty.push(faintedPokemon);
        }
        
        futureStates.push(newState);
    }
    
    return futureStates;
}

// Helper function to generate all possible combinations of switch-ins
function generateCombinations<T>(items: T[], count: number): T[][] {
    if (count === 0) return [[]];
    if (count > items.length) return [];
    
    const result: T[][] = [];
    
    // Generate permutations (order matters for different positions)
    function generatePermutations(remaining: T[], current: T[], needed: number): void {
        if (needed === 0) {
            result.push([...current]);
            return;
        }
        
        for (let i = 0; i < remaining.length; i++) {
            const item = remaining[i];
            const newRemaining = remaining.filter((_, index) => index !== i);
            generatePermutations(newRemaining, [...current, item], needed - 1);
        }
    }
    
    generatePermutations(items, [], count);
    return result;
}

function isUninitialized(state: BattleFieldState): boolean {
    return !state.playerActive.length;
}

function initializeActivePokemon(state: BattleFieldState): BattleFieldState {
    if (!isUninitialized(state))
        return state;

    state = state.clone();

    let newActive: ActivePokemon = { pokemon: popFromParty(state.playerParty, state.playerParty[0]), firstTurnOut: true };
     
    let playerActive: ActivePokemon[] = [newActive];
    if (state.isDoubles && state.playerParty.length)
        playerActive.push({ pokemon: popFromParty(state.playerParty, state.playerParty[0]), firstTurnOut: true });

    return new BattleFieldState(
        state.battleFormat,
        playerActive,
        state.cpuActive,
        state.playerParty,
        state.cpuParty,
        state.playerField,
        state.cpuField);
}

function popFromParty(party: Pokemon[], pokemon: Pokemon): Pokemon {
    const index = party.indexOf(pokemon);
    if (index === -1)
        throw new Error("Pokemon not found in party");

    return party.splice(index, 1)[0];
}