import { Generations } from "@smogon/calc";
import { IMoveScoringStrategy, IntuitionScoring } from "./simulator/phases/battle/player-move-selection-strategy";

export const gen = Generations.get(8);

export type ConfiguredHeuristics = {
    playerMoveScoringStrategy: IMoveScoringStrategy;
}

export const Heuristics: ConfiguredHeuristics = {
    playerMoveScoringStrategy: IntuitionScoring
}