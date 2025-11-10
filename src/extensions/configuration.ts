import { Generations } from "@smogon/calc";
import { IMoveScoringStrategy, IntuitionScoring } from "./simulator/phases/battle/player-move-selection-strategy";
import type { MoveResult } from "./simulator/moveScoring.contracts";

export const gen = Generations.get(8);

export type ConfiguredHeuristics = {
    playerMoveScoringStrategy: IMoveScoringStrategy;
}

export const Heuristics: ConfiguredHeuristics = {
    playerMoveScoringStrategy: IntuitionScoring
}

export interface RNGStrategy {
	getDamageRoll(moveResult: MoveResult): number;
}

export const playerRng: RNGStrategy = { getDamageRoll: (r) => r.lowestRollDamage };
export const cpuRng: RNGStrategy = { getDamageRoll: (r) => r.highestRollDamage };
