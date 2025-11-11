import { Move, Pokemon } from "@smogon/calc";
import { ActivePokemon, PokemonPosition, Trainer } from "../../moveScoring.contracts";

// export interface PossiblePokemonActions {
//     pokemon: ActivePokemon;
//     possibleActions: PossibleAction[];
// }

export interface PossibleTrainerAction {
    trainer: Trainer;
    pokemon: PokemonPosition;
    action: PossibleAction;
    slot: Slot;
}

export type PossibleAction = Action &  {
    probability: number;
};

export type Action = SwitchAction | MoveAction;

export interface SwitchAction {
    type: 'switch';
    switchIn: Pokemon | undefined;
    target: Slot;
}

export interface MoveAction {
    type: 'move';
    pokemon: Pokemon;
    move: TargetedMove;
}

export interface TargetedMove {
    move: Move;
    target: TargetSlot;
}

export interface Slot {
    slot: number;
}

export interface TargetSlot extends Slot {
    type: 'self' | 'ally' | 'opponent';
}

export type ScoredPossibleAction = PossibleAction & { score: number };