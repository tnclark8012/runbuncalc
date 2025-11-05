import { Pokemon } from "@smogon/calc";
import { BattleFieldState, SwitchStrategy, Trainer } from "./moveScoring.contracts";
import { BattleSimulator } from "./simulator";

interface SwitchInConsideration {
    pokemon: Pokemon;
    isFaster: boolean;
    outDamages: boolean;
    kosOpponent: boolean;
    getsKOd: boolean;
}

export class PartyOrderSwitchStrategy implements SwitchStrategy {
    constructor(private readonly getSelf: (state: BattleFieldState) => Trainer) {

    }
	public getPostKOSwitchIn(state: BattleFieldState): Pokemon | undefined {
		return this.getSelf(state).remainingPokemon[0];
	}
}