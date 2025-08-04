import { MoveResult } from "./moveScoring.contracts";

export class MoveScore {
    private readonly potentialScores: ScoreModifier[] = [];
    private fixedScore?: ScoreModifier;
    
    constructor(public readonly move: MoveResult
    ) {
    }

    public get finalScore(): number {
        if (this.fixedScore) {
            return this.fixedScore.modifier;
        }

        return this.potentialScores.reduce((soFar: number, current: ScoreModifier) => {
            if (current.percentChance >= 0.5) {
                soFar += current.modifier;
            }
            return soFar;
        }, 0);
    }

    public addScore(modifier: number, percentChance: number = 1): void {
        this.potentialScores.push(new ScoreModifier(modifier, percentChance));
    }

    public addAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void {
        this.addScore(modifier1Chance >= 0.5 ? modifier1 : modifier2);
    }

    public never(percentChance?: number): void {
        this.setScore(-999, percentChance);
    }

    public setScore(newScore: number, percentChance: number = 1): void {
        this.fixedScore = { modifier: newScore, percentChance };
    }

    public setAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void {
        this.setScore(modifier1Chance >= 0.5 ? modifier1 : modifier2);
    }


}

export class ScoreModifier {
    constructor(public readonly modifier: number, public readonly percentChance: number) {
    }
}