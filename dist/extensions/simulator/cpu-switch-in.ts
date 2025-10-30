import { Generations, Pokemon } from "@smogon/calc";
import { ActivePokemon, BattleFieldState } from "./moveScoring.contracts";
import { calculateAllMoves, findHighestDamageMove, getCpuMoveConsiderations, getDamageRanges } from "./moveScoring";

const generation = Generations.get(8);

export interface CPUSwitchConsideration {
    pokemon: Pokemon;
    aiIsFaster: boolean;
    aiOHKOs: boolean;
    playerOHKOs: boolean;
    aiOutdamagesPlayer: boolean;
}

export function applyCpuSwitchIns(state: BattleFieldState): BattleFieldState {
    state = initializeActivePokemon(state);
    const cpuParty = state.cpuParty;
    
    for (let i = 0; i < state.cpuActive.length; i++) {
        if (state.cpuActive[i].pokemon.curHP() <= 0) {
            let chosen = chooseSwitchIn(cpuParty, state.playerActive[0].pokemon, state);
            if (!chosen)
                return state;

            let newActive: ActivePokemon = { pokemon: popFromParty(cpuParty, chosen), firstTurnOut: true };
            state.cpuActive[i] = newActive;
        }
    }

    return state;
}

export function chooseSwitchIn(cpuParty: Pokemon[], seenPlayerMon: Pokemon, state: BattleFieldState): Pokemon | undefined{
    let eligibleSwitchIns: Pokemon[] = cpuParty.filter(p => p.curHP && p.curHP() > 0);
    if (!eligibleSwitchIns.length)
        return;

    let considerations = eligibleSwitchIns.map<CPUSwitchConsideration>(cpuPokemon => {
        let playerDamageResults = calculateAllMoves(generation, cpuPokemon, seenPlayerMon, state.cpuField);
        let cpuDamageResults = calculateAllMoves(generation, cpuPokemon, seenPlayerMon, state.cpuField);
        let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
        let consideredMoves = getCpuMoveConsiderations(cpuDamageResults, cpuAssumedPlayerMove, state.cpuField, /*last turn outcome*/undefined);
        
        return {
            pokemon: cpuPokemon,
            aiIsFaster: cpuPokemon.stats.spe >= seenPlayerMon.stats.spe,
            aiOHKOs: consideredMoves.some(m => m.aiWillOHKOPlayer),
            playerOHKOs: consideredMoves.some(m => m.playerWillKOAI),
            aiOutdamagesPlayer: consideredMoves.some(m => m.aiOutdamagesPlayer),
        };
    });

    let chosen: Pokemon | undefined;
    if (chosen = considerations.find(c => c.aiIsFaster && c.aiOHKOs)?.pokemon) {
        return chosen;
    }
    
    if (chosen = considerations.find(c => !c.aiIsFaster && c.aiOHKOs && !c.playerOHKOs)?.pokemon) {
        return chosen;
    }

    if (chosen = considerations.find(c => c.aiIsFaster && c.aiOutdamagesPlayer && c.playerOHKOs)?.pokemon) {
        return chosen;
    }

    if (chosen = considerations.find(c => !c.aiIsFaster && c.aiOutdamagesPlayer && c.playerOHKOs)?.pokemon) {
        return chosen;
    }

    if (chosen = considerations.find(c => c.aiIsFaster && c.aiOutdamagesPlayer)?.pokemon) {
        return chosen;
    }

    if (chosen = considerations.find(c => !c.aiIsFaster && c.aiOutdamagesPlayer)?.pokemon) {
        return chosen;
    }

    return considerations[0].pokemon;
}

function isUninitialized(state: BattleFieldState): boolean {
    return !state.cpuActive.length || !state.playerActive.length;
}

function initializeActivePokemon(state: BattleFieldState): BattleFieldState {
    if (!isUninitialized(state))
        return state;

    state = state.clone();
    let cpuActive: ActivePokemon[] = [{ pokemon: state.cpuParty.shift()!, firstTurnOut: true }];
    if (state.isDoubles && state.cpuParty.length)
        cpuActive.push({ pokemon: state.cpuParty.shift()!, firstTurnOut: true });

    let playerActive: ActivePokemon[] = [{ pokemon: state.playerParty.shift()!, firstTurnOut: true }];
    if (state.isDoubles && state.playerParty.length)
        playerActive.push({ pokemon: state.playerParty.shift()!, firstTurnOut: true });

    return new BattleFieldState(
        state.battleFormat,
        playerActive,
        cpuActive,
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