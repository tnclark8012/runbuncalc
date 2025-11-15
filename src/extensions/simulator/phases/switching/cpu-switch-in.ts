import { Generations, Pokemon } from "@smogon/calc";
import { ActivePokemon, BattleFieldState, CpuTrainer, PokemonPosition, Trainer } from "../../moveScoring.contracts";
import { calculateAllMoves, findHighestDamageMove, getCpuMoveConsiderations, getDamageRanges } from "../../moveScoring";
import { SwitchAction } from "../battle/move-selection.contracts";
import { executeSwitch, popFromParty } from "./execute-switch";
import { PokemonReplacer } from "../../battle-field-state-visitor";

const generation = Generations.get(8);

export interface CPUSwitchConsideration {
    pokemon: Pokemon;
    aiIsFaster: boolean;
    aiOHKOs: boolean;
    playerOHKOs: boolean;
    aiOutdamagesPlayer: boolean;
}

export function applyCpuSwitchIns(state: BattleFieldState): BattleFieldState {
    if (isUninitialized(state))
        return initializeActivePokemon(state)
    
    const cpuParty = state.cpu.party;
    
    let switches: SwitchAction[] = [];
    let availableSwitchIns = [ ...cpuParty];
    for (let i = 0; i < state.cpu.active.length; i++) {
        if (state.cpu.active[i].pokemon.curHP() <= 0) {
            let replacement: Pokemon | undefined = chooseSwitchIn(availableSwitchIns, state.player.active[i].pokemon, state)
            if (replacement)
                popFromParty(availableSwitchIns, replacement);

            let switchAction: SwitchAction = {
                type: 'switch',
                switchIn: replacement,
                target: { slot: i }
            };

            switches.push(switchAction);
        }
    }

    for (let switchAction of switches) {
        const outcome = executeSwitch(state, state.cpu, switchAction);
        state = outcome.outcome;
    }

    return state;
}

export function chooseSwitchIn(cpuParty: Pokemon[], seenPlayerMon: Pokemon, state: BattleFieldState): Pokemon | undefined {
    let eligibleSwitchIns: Pokemon[] = cpuParty.filter(p => p.curHP && p.curHP() > 0);
    if (!eligibleSwitchIns.length)
        return;

    let considerations = eligibleSwitchIns.map<CPUSwitchConsideration>(cpuPokemon => {
        let playerDamageResults = calculateAllMoves(generation, seenPlayerMon, cpuPokemon, state.playerField);
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

    let scored = considerations.map(c => ({ ...c, score: getScore(c) }));
    let maxScore = scored[0];
    for (let s of scored) {
        if (s.score > maxScore.score)
            maxScore = s;
    }

    return maxScore.pokemon;
}

function getScore(consideration: CPUSwitchConsideration): number {
    if (consideration.pokemon.named('Ditto'))
        return 2;
    if (consideration.pokemon.named('Wynaut', 'Wobbuffet') && !(!consideration.aiIsFaster && consideration.playerOHKOs))
        return 2;
    if (consideration.aiIsFaster && consideration.aiOHKOs)
        return 5;
    if (!consideration.aiIsFaster && consideration.aiOHKOs && !consideration.playerOHKOs)
        return 4;
    if (consideration.aiIsFaster && consideration.aiOutdamagesPlayer)
        return 3;
    if (!consideration.aiIsFaster && consideration.aiOutdamagesPlayer)
        return 2;
    if (consideration.aiIsFaster)
        return 1;

    return 0;
}

function isUninitialized(state: BattleFieldState): boolean {
    return !state.cpu.active.length || !state.player.active.length;
}

function initializeActivePokemon(state: BattleFieldState): BattleFieldState {
    state = state.clone();
    let cpuActive: PokemonPosition[] = [new PokemonPosition(state.cpu.party.shift()!, true)];
    if (state.isDoubles && state.cpu.party.length)
        cpuActive.push(new PokemonPosition(state.cpu.party.shift()!, true));

    return new BattleFieldState(
        state.player,
        new CpuTrainer(cpuActive, state.cpu.party, state.cpu.switchStrategy),
        state.field,
        state.turnNumber);
}