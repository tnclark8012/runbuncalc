import { Field } from './field';
import { Generation } from './data/interface';
import { Pokemon } from './pokemon';
import { TurnOutcome } from './moveScoring.contracts';
export interface MatchupResult {
}
export interface BattleResult {
    winner: Pokemon;
    turnOutcomes: TurnOutcome[];
}
export declare class BattleSimulator {
    private readonly gen;
    private readonly originalState;
    private simulationState;
    private readonly turns;
    constructor(gen: Generation, playerPokemon: Pokemon, cpuPokemon: Pokemon, playerField: Field, cpuField: Field);
    private get lastTurn();
    getResult(maxTurns?: number): BattleResult;
    private simulateTurn;
    private calculateCpuMove;
    private calculatePlayerMove;
    private static moveKillsAttacker;
    private static resolveTurnOrder;
    private static findHighestDamageMove;
}
