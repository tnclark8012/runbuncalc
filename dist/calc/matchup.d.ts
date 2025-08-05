import { Field } from './field';
import { Generation } from './data/interface';
import { Move } from './move';
import { Pokemon } from './pokemon';
export interface MatchupResult {
}
export interface BattleResult {
    winner: Pokemon;
    turnOutcomes: TurnOutcome[];
}
export interface TurnOutcome {
    actions: MoveResult[];
    battleState: BattleState;
}
export interface BattleState {
    readonly playerPokemon: Pokemon;
    readonly cpuPokemon: Pokemon;
    readonly playerField: Field;
    readonly cpuField: Field;
}
export declare class BattleSimulator {
    private readonly gen;
    private readonly playerPokemon;
    private readonly cpuPokemon;
    private readonly playerField;
    private readonly cpuField;
    private readonly originalState;
    constructor(gen: Generation, playerPokemon: Pokemon, cpuPokemon: Pokemon, playerField: Field, cpuField: Field);
    getResult(): BattleResult;
    private simulateTurn;
    private calculateCpuMove;
    private calculatePlayerMove;
    private static moveKillsUser;
    private static resolveTurnOrder;
    private static findHighestDamageMove;
}
export interface MoveResult {
    attacker: Pokemon;
    defender: Pokemon;
    move: Move;
    lowestRollDamage: number;
    lowestRollHpPercentage: number;
    highestRollDamage: number;
    highestRollHpPercentage: number;
}
