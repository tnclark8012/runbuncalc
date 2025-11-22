import { Pokemon } from "@smogon/calc";
import { PokemonPosition, Trainer } from "./moveScoring.contracts";
import { MoveAction, PossibleAction, PossibleTrainerAction, Slot, SwitchAction, TargetedMove } from "./phases/battle/move-selection.contracts";

export interface IPossibleTrainerActionVisitorWithRewrite {
    visitAction(action: PossibleTrainerAction): PossibleTrainerAction;
    visitTrainer(trainer: Trainer): Trainer;
    visitActivePokemon(pokemon: PokemonPosition): PokemonPosition;
    visitSlot(slot: Slot): Slot;
    visitPossibleAction(action: PossibleAction): PossibleAction;
    visitPossibleSwitchAction(action: Exclude<PossibleAction, MoveAction>): PossibleAction;
    visitPossibleMoveAction(action: Exclude<PossibleAction, SwitchAction>): PossibleAction;
}

export class PossibleTrainerActionVisitorWithRewrite implements IPossibleTrainerActionVisitorWithRewrite {
    visitPossibleSwitchAction(action: Exclude<PossibleAction, MoveAction>): Exclude<PossibleAction, MoveAction> {
        return {
            ...action,
            switchIn: action.switchIn ? this.visitPokemon(action.switchIn) : undefined,
        };
    }

    visitPossibleMoveAction(action: Exclude<PossibleAction, SwitchAction>): Exclude<PossibleAction, SwitchAction> {
        return {
            type: 'move',
            pokemon: this.visitPokemon(action.pokemon),
            move: action.move,
            probability: action.probability
        };
    }

    visitTrainer(trainer: Trainer): Trainer {
        return new Trainer(
            trainer.name,
            trainer.active.map(p => this.visitActivePokemon(p)),
            trainer.party.map(p => p.clone()),
            trainer.switchStrategy
        )
    }

    visitActivePokemon(pokemon: PokemonPosition): PokemonPosition {
        return new PokemonPosition(
            this.visitPokemon(pokemon.pokemon),
            pokemon.firstTurnOut);
    }

    visitPokemon(pokemon: Pokemon): Pokemon {
        return pokemon;
    }

    visitSlot(slot: Slot): Slot {
        return slot;
    }

    visitPossibleAction(action: PossibleAction): PossibleAction {
        return action.type === 'move' ?
            this.visitPossibleMoveAction(action) :
            this.visitPossibleSwitchAction(action);
    }

    public visitAction(action: PossibleTrainerAction): PossibleTrainerAction {
        return {
            action: this.visitPossibleAction(action.action),
            pokemon: this.visitActivePokemon(action.pokemon),
            slot: this.visitSlot(action.slot),
            trainer: this.visitTrainer(action.trainer)
        };
    }
}

export class TrainerActionPokemonReplacer extends PossibleTrainerActionVisitorWithRewrite {
    private readonly _from: Pokemon;
    private readonly _to: Pokemon;

    constructor(replacement: Pokemon);
    constructor(from: Pokemon, to: Pokemon);
    constructor(from: Pokemon, to?: Pokemon) {
        super();
        this._from = from;
        this._to = to || from;
    }

    public static replace(possibleAction: PossibleTrainerAction, from: Pokemon, to?: Pokemon): PossibleTrainerAction {
        const replacer = new TrainerActionPokemonReplacer(from, to || from);
        return replacer.visitAction(possibleAction);
    }

    public override visitPokemon(pokemon: Pokemon): Pokemon {
        if (pokemon.equals(this._from)) {
            return this._to;
        }

        return pokemon;
    }
}