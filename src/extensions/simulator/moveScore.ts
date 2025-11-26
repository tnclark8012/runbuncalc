import { MoveResult } from "./moveScoring.contracts";

export class MoveScore {
    private readonly potentialScores: ScoreModifier[] = [];
    private fixedScores: ScoreModifier[] = [];
    private score: ScoreModifier;
    
    constructor(public readonly move: MoveResult) {
        this.score = new ScoreModifier(0, 1);
    }

    public getScores(): ScoreModifier[] {
        if (this.fixedScores.length) 
            return this.fixedScores;

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

    public equals(other: MoveScore): boolean {
        if (this.move !== other.move)
            return false;

        const thisScores = this.getScores();
        const otherScores = other.getScores();
        if (thisScores.length !== otherScores.length)
            return false;

        for (let i = 0; i < thisScores.length; i++) {
            if (!thisScores[i].equals(otherScores[i]))
                return false;
        }

        return true;
    }

    public get finalScore(): number {
        if (this.fixedScores?.length) {
            return this.fixedScores[0].modifier;
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

    public addAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number, modifier2Chance?: number): void {
        modifier2Chance = modifier2Chance == null ? 1 - modifier1Chance : modifier2Chance;
        this.potentialScores.push(new ScoreModifier(modifier1Chance >= 0.5 ? modifier1 : modifier2, 1));
        this.score.addAlternativeBranches(modifier1, modifier1Chance, modifier2, modifier2Chance);
    }

    /**
     * Adds conditional alternative scores without creating a 0-remainder branch.
     * This is useful for interdependent scoring where the "not getting this bonus"
     * scenario is implicitly covered by another move getting it.
     * 
     * @param modifier1 First modifier value
     * @param modifier1Chance Probability of first modifier (between 0 and 1)
     * @param modifier2 Second modifier value  
     * @param modifier2Chance Probability of second modifier (between 0 and 1)
     */
    public addConditionalAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number, modifier2Chance: number): void {
        this.potentialScores.push(new ScoreModifier(modifier1Chance >= 0.5 ? modifier1 : modifier2, 1));
        // Normalize the probabilities to sum to 1.0 to avoid creating a 0-remainder branch
        const totalProb = modifier1Chance + modifier2Chance;
        if (totalProb > 0) {
            const normalizedMod1Chance = modifier1Chance / totalProb;
            const normalizedMod2Chance = modifier2Chance / totalProb;
            this.score.addAlternativeBranches(modifier1, normalizedMod1Chance, modifier2, normalizedMod2Chance);
        }
    }

    public never(percentChance?: number): void {
        this.addScore(-50, percentChance);
    }

    public setScore(newScore: number, percentChance: number = 1): void {
        this.fixedScores = [new ScoreModifier(newScore, percentChance)];
    }

    public setAlternativeScores(modifier1: number, modifier1Chance: number, modifier2: number): void {
        this.fixedScores = [new ScoreModifier(modifier1, modifier1Chance), new ScoreModifier(modifier2, 1 - modifier1Chance)];
    }
}

export class ScoreModifier {
    public readonly branches: ScoreModifier[] = [];
    constructor(public readonly modifier: number, public readonly percentChance: number) {
    }

    public equals(other: ScoreModifier): boolean {
        return this.branches.length === 0 && other.branches.length === 0 && this.modifier === other.modifier && this.percentChance === other.percentChance;
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

    public addAlternativeBranches(modifier1: number, modifier1Chance: number, modifier2: number, modifier2Chance?: number): void {
        modifier2Chance = modifier2Chance == null ? 1 - modifier1Chance : modifier2Chance;
        if (this.branches.length === 0) {
            if (modifier1Chance === 1 || modifier1Chance === 0) {
                this.branches.push(new ScoreModifier(this.modifier + (modifier1Chance ? modifier1 : modifier2), this.percentChance));
            }
            else {
                this.branches.push(new ScoreModifier(this.modifier + modifier1, this.percentChance * modifier1Chance), new ScoreModifier(this.modifier + modifier2, this.percentChance * (modifier2Chance)));
                let remainingChance = (100 - modifier1Chance * 100 - modifier2Chance * 100); // Hooray for JS floating point math.
                if (remainingChance)
                    this.branches.push(new ScoreModifier(this.modifier, this.percentChance * remainingChance/100));
            }
        }
        else {
            for (let branch of this.branches) {
                branch.addAlternativeBranches(modifier1, modifier1Chance, modifier2, modifier2Chance);
            }
        }
    }
}