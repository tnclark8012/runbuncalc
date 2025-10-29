import { Generations, Pokemon } from "@smogon/calc";
import { BattleFieldState } from "./moveScoring.contracts";
import { calculateAllMoves, findHighestDamageMove, getCpuMoveConsiderations, getDamageRanges } from "./moveScoring";

const generation = Generations.get(8);

export interface CPUSwitchConsideration {
    pokemon: Pokemon;
    aiIsFaster: boolean;
    aiOHKOs: boolean;
    playerOHKOs: boolean;
    aiOutdamagesPlayer: boolean;
}

export function calculateCpuSwitchIn(cpuParty: Pokemon[], seenPlayerMon: Pokemon, state: BattleFieldState): Pokemon {
    let eligibleSwitchIns: Pokemon[] = cpuParty.filter(p => p.curHP && p.curHP() > 0);
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