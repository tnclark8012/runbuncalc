import { MoveResult } from "./moveScoring.contracts";

export class MoveScore {
    private readonly potentialScores: ScoreModifier[] = [];
    private fixedScore?: ScoreModifier;
    private score: ScoreModifier;
    
    constructor(public readonly move: MoveResult) {
        this.score = new ScoreModifier(0, 1);
    }

    public getScores(): ScoreModifier[] {
        let finalScores: Map<number, number> = new Map();
        let toVisit: ScoreModifier[] = [this.score];
        while (toVisit.length > 0) {
            let current = toVisit.pop()!;
            if (current.branches.length === 0) {
                const existing = finalScores.get(current.modifier) || 0;
                finalScores.set(current.modifier, existing + current.percentChance);
            }
            else {
                toVisit.push(...current.branches);
            }
        }

        return Array.from(finalScores.entries()).map(([modifier, percentChance]) => new ScoreModifier(modifier, percentChance));
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

    /**
     * Consider this in the AI doc:
     *  Highest damaging move: +6 (80%), +8 (20%)  
     * 
     * Now consider the AI Petalburg Woods Grunt Carvanha sees this against a Starly:
     * Bite 55.8 - 70.5% (19, 19, 19, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 24)
     * Water Pulse 52.9 - 64.7% (18, 18, 19, 19, 19, 19, 19, 19, 19, 21, 21, 21, 21, 21, 21, 22)
     * Aqua Jet 38.2 - 47%
     * Poison Fang 32.3 - 41.1%
     * 
     * When calcing AI behavior, what are the move scores if that was the single rule?
     * 
     * Water Pulse beats Bite in 24 of 256 cases
     * Probability: 9.375%
     *
     * Bite [90.625% * 80% = 72.5%]: +6, [90.625% * 20% = 18.125%]: +8, 9.375%: 0
     * Water Pulse [9.375% * 80% = 7.5%]: +6, [9.375% * 20% = 1.875%]: +8, 90.625%: 0
     * Aqua Jet 0
     * Poison Fang 0
     * 
     *       biteScore.addPotentialScore(0.8, 6, 8, .90625)
     * waterPulseScore.addPotentialScore(0.8, 6, 8, .09375)
     * @param potentialChance 
     * @param modifier 
     * @param percentChance 
     */
    // public addPotentialScore(potentialChance: number, modifier: number, percentChance: number = 1): void {
    //     this.potentialScores.push(new ScoreModifier(modifier, percentChance * potentialChance));
    // }

    public addScore(modifier: number, percentChance: number = 1): void {
        this.potentialScores.push(new ScoreModifier(modifier, percentChance));
        this.score.addBranch(modifier, percentChance);
    }

    public addAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void {
        this.potentialScores.push(new ScoreModifier(modifier1Chance >= 0.5 ? modifier1 : modifier2, 1));
        this.score.addAlternativeBranches(modifier1, modifier1Chance, modifier2);
    }

    public never(percentChance?: number): void {
        this.addScore(-50, percentChance);
    }

    public setScore(newScore: number, percentChance: number = 1): void {
        this.fixedScore = new ScoreModifier(newScore, percentChance);
        this.addScore(-this.score.modifier + newScore, percentChance);
    }

    public setAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void {
        this.setScore(modifier1Chance >= 0.5 ? modifier1 : modifier2);
    }
}

export class ScoreModifier {
    public readonly branches: ScoreModifier[] = [];
    constructor(public readonly modifier: number, public readonly percentChance: number) {
    }

    public addBranch(modifier: number, percentChance: number): void { // really, this is meaning total score
        if (this.branches.length === 0) {
            this.addAlternativeBranches(modifier, percentChance, 0);
        }
        else {
            for (let branch of this.branches) {
                branch.addBranch(modifier, percentChance);
            }
        }
    }

    public addAlternativeBranches(modifier1: number, modifier1Chance: number, modifier2: number): void {
        if (this.branches.length === 0) {
            if (modifier1Chance === 1 || modifier1Chance === 0) {
                this.branches.push(new ScoreModifier(this.modifier + (modifier1Chance ? modifier1 : modifier2), this.percentChance));
            }
            else {
                this.branches.push(new ScoreModifier(this.modifier + modifier1, this.percentChance * modifier1Chance), new ScoreModifier(this.modifier + modifier2, this.percentChance * (1 - modifier1Chance)));
            }
        }
        else {
            for (let branch of this.branches) {
                branch.addAlternativeBranches(modifier1, modifier1Chance, modifier2);
            }
        }
    }
}