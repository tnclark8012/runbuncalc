import { Generations, Pokemon } from "@smogon/calc";
import { ActivePokemon, BattleFieldState, PlayerTrainer, PokemonPosition, Trainer } from "../../moveScoring.contracts";
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
    for (let i = 0; i < state.player.active.length; i++) {
        if (isFainted(state.player.active[i].pokemon)) {
            faintedPositions.push(i);
        }
    }
    
    // If no fainted Pokemon, return original state
    if (faintedPositions.length === 0) {
        return [state];
    }
    
    // Get all non-fainted Pokemon from party
    const availableSwitchIns = state.player.party.filter(pokemon => !isFainted(pokemon));

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
            const faintedPokemon = newState.player.active[position].pokemon;
            
            // Remove switch-in from party
            const switchInIndex = newState.player.party.findIndex((p: Pokemon) => p.equals(switchInPokemon));
            newState.player.party.splice(switchInIndex, 1);
            
            // Replace active Pokemon
            newState.player.active[position] = new PokemonPosition(switchInPokemon, true);
            
            // Add fainted Pokemon to end of party
            newState.player.party.push(faintedPokemon);
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
    return !state.player.active.length;
}

function initializeActivePokemon(state: BattleFieldState): BattleFieldState {
    if (!isUninitialized(state))
        return state;

    state = state.clone();

    let newActive: PokemonPosition = new PokemonPosition(popFromParty(state.player.party, state.player.party[0]), true);
     
    let playerActive: PokemonPosition[] = [newActive];
    if (state.isDoubles && state.player.party.length)
        playerActive.push(new PokemonPosition(popFromParty(state.player.party, state.player.party[0]), true));

    return new BattleFieldState(
        new PlayerTrainer(playerActive, state.player.party, state.player.switchStrategy),
        state.cpu,
        state.field);
}

function popFromParty(party: Pokemon[], pokemon: Pokemon): Pokemon {
    const index = party.indexOf(pokemon);
    if (index === -1)
        throw new Error("Pokemon not found in party");

    return party.splice(index, 1)[0];
}