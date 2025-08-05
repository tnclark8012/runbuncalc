import { MoveResult } from "./moveScoring.contracts";
export declare class MoveScore {
    readonly move: MoveResult;
    private readonly potentialScores;
    private fixedScore?;
    constructor(move: MoveResult);
    get finalScore(): number;
    addScore(modifier: number, percentChance?: number): void;
    addAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void;
    never(percentChance?: number): void;
    setScore(newScore: number, percentChance?: number): void;
    setAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void;
}
export declare class ScoreModifier {
    readonly modifier: number;
    readonly percentChance: number;
    constructor(modifier: number, percentChance: number);
}
