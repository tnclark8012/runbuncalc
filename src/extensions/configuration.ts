import { Generations, Pokemon } from "@smogon/calc";
import { BasicScoring, IMoveScoringStrategy, IntuitionScoring } from "./simulator/phases/battle/player-move-selection-strategy";
import type { BattleFieldState, MoveResult, PokemonPosition, Trainer } from "./simulator/moveScoring.contracts";
import { isMoveAction, PossibleAction, PossibleSwitchAction, PossibleTrainerAction } from "./simulator/phases/battle/move-selection.contracts";
import { createMove, megaEvolve } from "./simulator/moveScoring";

export const gen = Generations.get(8);

export type ConfiguredHeuristics = {
    playerMoveScoringStrategy: IMoveScoringStrategy;
    playerActionProvider?: ITrainerActionProvider;
}

export const Heuristics: ConfiguredHeuristics = {
    playerMoveScoringStrategy: BasicScoring
}

export interface RNGStrategy {
    getDamageRoll(moveResult: MoveResult): number;
    getHits(moveResult: MoveResult): number;
}

export interface ITrainerActionProvider {
    /** Should return an array with an entry for each active pokemon's action */
    getPossibleActions(state: BattleFieldState): PossibleTrainerAction[][] | undefined;
}

export const playerRng: RNGStrategy = { getDamageRoll: (r) => r.lowestRollDamage, getHits: (r) => r.move.hits };
export const cpuRng: RNGStrategy = { getDamageRoll: (r) => r.highestRollDamage, getHits: (r) => r.move.hits };

export type PlannedMoveAction = {
    type: 'move';
    pokemon: Pokemon;
    mega?: boolean;
    move: string;
    targetSlot?: number;
};

export type PlannedSwitchAction = {
    type: 'switch';
    pokemon: Pokemon;
    targetSlot?: number;
}

export type PlannedTrainerAction = PlannedMoveAction | PlannedSwitchAction;

export class PlannedPlayerActionProvider implements ITrainerActionProvider {
    constructor(private readonly plannedActions: PlannedTrainerAction[][]) {
    }

    public getPossibleActions(state: BattleFieldState): PossibleTrainerAction[][] | undefined {
        let plannedActions = this.plannedActions[state.turnNumber - 1];
        if (!plannedActions) {
            return undefined;
        }
        return [plannedActions.map((action, slot) => {
            let possible  = this.toPossibleTrainerAction(state.player, action, slot);
            return possible;
        })];
    }

    private toPossibleTrainerAction(player: Trainer, action: PlannedTrainerAction, slot: number): PossibleTrainerAction {
        if (action.type === 'move') {
            return {
                trainer: player,
                pokemon: player.getActivePokemon(action.pokemon)!,
                action: {
                    type: 'move',
                    move: {
                        move: createMove(action.pokemon, action.move),
                        target: { type: 'opponent', slot: action.targetSlot ?? 0 }
                    },
                    pokemon: action.mega ? megaEvolve(action.pokemon) : action.pokemon,
                    probability: 1
                },
                slot: { slot: slot }
            };
        }

        return {
            trainer: player,
            pokemon: player.active[slot],
            action: <PossibleSwitchAction>{
                type: 'switch',
                switchIn: action.pokemon,
                probability: 1,
                target: { slot: slot }
            },
            slot: { slot }
        };
    }
}

export function attack(pokemon: Pokemon, move: string, mega: boolean = false, targetSlot: number = 0): PlannedMoveAction {
    return {
        type: 'move',
        pokemon,
        mega,
        move,
        targetSlot
    };
}

export function switchTo(pokemon: Pokemon): PlannedSwitchAction {
    return {
        type: 'switch',
        pokemon,
    };
}