import { Field, Move, Pokemon } from '@smogon/calc';

export interface MoveConsideration {
	result: MoveResult;
	kos: boolean;
	lowestRollHpPercentage: number;
	hightestRollHpPercentage: number;
    aiMon: Pokemon;
    playerMon: Pokemon;
}

export interface MoveResult {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	lowestRollDamage: number;
	lowestRollHpPercentage: number;
	highestRollDamage: number;
	highestRollHpPercentage: number;
}

export interface CPUMoveConsideration extends MoveConsideration {
    isHighestDamagingMove?: boolean;
    isDamagingMove: boolean;
    aiIsFaster: boolean;
    aiIsSlower: boolean;
    playerMove: MoveResult;
    playerWillKOAI: boolean;
    playerWill2HKOAI: boolean;
    lastTurnCPUMove: Move | undefined;
    aiMonFirstTurnOut: boolean;
    field: Field
}

export interface PlayerMoveConsideration extends MoveConsideration {
	kosThroughRequiredLifesaver: boolean;
}

export interface TurnOutcome {
	turnNumber: number;
	actions: MoveResult[];
	endOfTurnState: BattleFieldState;
}

export interface ActivePokemon {
	pokemon: Pokemon;
	firstTurnOut?: boolean;
}

export class BattleFieldState {
	constructor(
		public readonly playerActive: ActivePokemon[],
		public readonly cpuActive: ActivePokemon[],
		public readonly playerParty: Pokemon[],
		public readonly cpuParty: Pokemon[],
		public readonly playerField: Field,
		public readonly cpuField: Field) {
		
	}

	public clone(): BattleFieldState {
		return new BattleFieldState(
			this.playerActive.map(p => ({ ...p, pokemon: p.pokemon.clone() })),
			this.cpuActive.map(p => ({ ...p, pokemon: p.pokemon.clone() })),
			this.playerParty.map(p => p.clone()),
			this.cpuParty.map(p => p.clone()),
			this.playerField.clone(),
			this.cpuField.clone()
		)
	}
}