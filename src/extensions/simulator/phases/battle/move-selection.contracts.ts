import { Move, Pokemon } from "@smogon/calc";
import { ActivePokemon } from "../../moveScoring.contracts";

export interface PossiblePokemonActions {
    pokemon: ActivePokemon;
    possibleActions: PossibleAction[];
}

export interface PossiblePokemonAction {
    pokemon: ActivePokemon;
    action: PossibleAction;
}

export interface PossibleAction {
    action: Action;
    probability: number;
}

export type Action = SwitchAction | MoveAction;

export interface SwitchAction {
    type: 'switch';
    switchIn: Pokemon;
}

export interface MoveAction {
    type: 'move';
    move: TargetedMove;
}

export interface TargetedMove {
    move: Move;
    target: TargetSlot;
}

export interface TargetSlot {
    type: 'self' | 'ally' | 'opponent';
    slot: number;
}