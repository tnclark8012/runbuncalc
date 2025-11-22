import { Field, Pokemon, Side } from "@smogon/calc";
import { BattleFieldState, PokemonPosition, Trainer } from "./moveScoring.contracts";
import { getFinalSpeed } from "./utils";

export interface IBattleFieldStateVisitor {
    visitActivePokemon?(state: BattleFieldState, pokemon: PokemonPosition, field: Field, side: Side): void;
}

export function visitActivePokemonInSpeedOrder(state: BattleFieldState, visitor: IBattleFieldStateVisitor): void {
    if (!visitor.visitActivePokemon)
        return;

    let toVisit: Array<{ active: PokemonPosition, field: Field, side: Side }> = [];
    for (let active of state.player.active) {
        toVisit.push({ active, field: state.field, side: state.playerSide });
    }

    for (let active of state.cpu.active) {
        toVisit.push({ active, field: state.field, side: state.cpuSide });
    }

    toVisit.sort((a,b) => {
        let aSpeed = getFinalSpeed(a.active.pokemon, a.field, a.side);
        let bSpeed = getFinalSpeed(b.active.pokemon, b.field, b.side);
        return bSpeed - aSpeed;
    });

    for (let visit of toVisit)
        visitor.visitActivePokemon(state, visit.active, visit.field, visit.side);
}

export interface IBattleFieldStateVisitorWithRewrite {
    visitState(state: BattleFieldState): BattleFieldState;
    visitTrainer(trainer: Trainer): Trainer;
    visitActivePokemon(pokemon: PokemonPosition): PokemonPosition;
    visitPartyPokemon(pokemon: Pokemon): Pokemon;
    visitField(field: Field): Field;
}

export class BattleFieldStateRewriter implements IBattleFieldStateVisitorWithRewrite {

    public visitState(state: BattleFieldState): BattleFieldState {
        return new BattleFieldState(
            this.visitTrainer(state.player),
            this.visitTrainer(state.cpu),
            this.visitField(state.field),
            state.turnNumber
        );
    }

    public visitTrainer(trainer: Trainer): Trainer {
        return new Trainer(
            trainer.name,
            trainer.active.map(active => this.visitActivePokemon(active)),
            trainer.party.map(p => this.visitPartyPokemon(p))
        );
    }

    public visitActivePokemon(pokemon: PokemonPosition): PokemonPosition {
        return pokemon.clone();
    }

    public visitPartyPokemon(pokemon: Pokemon): Pokemon {
        return pokemon.clone();
    }

    public visitField(field: Field): Field {
        return field.clone();
    }
}


export class PokemonPositionReplacer extends BattleFieldStateRewriter {
    private readonly _from: PokemonPosition;
    private readonly _to: PokemonPosition;

    constructor(replacement: PokemonPosition);
    constructor(from: PokemonPosition, to: PokemonPosition);
    constructor(from: PokemonPosition, to?: PokemonPosition) {
        super();
        this._from = from;
        this._to = to || from;
    }

    public static replace(state: BattleFieldState, from: PokemonPosition, to?: PokemonPosition): BattleFieldState {
        const replacer = new PokemonPositionReplacer(from, to || from);
        return replacer.visitState(state);
    }

    public override visitActivePokemon(pokemon: PokemonPosition): PokemonPosition {
        if (pokemon.pokemon.equals(this._from.pokemon)) {
            return this._to;
        }

        return pokemon;
    
    }
}

export class PokemonReplacer extends BattleFieldStateRewriter {
    private readonly _from: Pokemon;
    private readonly _to: Pokemon;

    constructor(replacement: Pokemon);
    constructor(from: Pokemon, to: Pokemon);
    constructor(from: Pokemon, to?: Pokemon) {
        super();
        this._from = from;
        this._to = to || from;
    }

    public static replace(state: BattleFieldState, from: Pokemon, to?: Pokemon): BattleFieldState {
        const replacer = new PokemonReplacer(from, to || from);
        return replacer.visitState(state);
    }

    public override visitActivePokemon(pokemon: PokemonPosition): PokemonPosition {
        if (pokemon.pokemon.equals(this._from)) {
            return new PokemonPosition(this._to, this._from.equals(this._to) ? pokemon.firstTurnOut : true)
        }

        return pokemon;
    
    }
}