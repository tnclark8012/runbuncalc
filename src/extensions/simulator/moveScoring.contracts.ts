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

export interface PokemonPosition {
	pokemon: Pokemon;
	firstTurnOut?: boolean;
}

export class BattleFieldState {
	constructor(
		public readonly playerSide: PokemonPosition,
		public readonly cpuSide: PokemonPosition,
		public readonly playerField: Field,
		public readonly cpuField: Field) {
		
	}

	public clone(): BattleFieldState {
		return new BattleFieldState(
			{ ...this.playerSide, pokemon: this.playerSide.pokemon.clone() },
			{ ...this.cpuSide, pokemon: this.cpuSide.pokemon.clone() },
			this.playerField.clone(),
			this.cpuField.clone()
		)
	}
}