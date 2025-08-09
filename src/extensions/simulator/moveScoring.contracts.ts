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

export class PokemonPosition {
	constructor(public pokemon: Pokemon,
		public firstTurnOut?: boolean)
		{

		}

	public clone(): PokemonPosition {
		return new PokemonPosition(this.pokemon.clone(), this.firstTurnOut);
	}
}

export interface SwitchStrategy {
	getPostKOSwitchIn(state: BattleFieldState): Pokemon | undefined;
}

export class Trainer {
	constructor(
		public readonly activePokemon: PokemonPosition,
		public readonly remainingPokemon: Pokemon[],
		public readonly switchStrategy: SwitchStrategy)
	{
	}

	public clone(): Trainer {
		return new Trainer(
			this.activePokemon.clone(),
			this.remainingPokemon.map(p => p.clone()),
			this.switchStrategy);
	}
}

export class BattleFieldState {
	constructor(
		public readonly player: Trainer,
		public readonly cpu: Trainer,
		public readonly playerField: Field,
		public readonly cpuField: Field) {
		
	}

	public clone(): BattleFieldState {
		return new BattleFieldState(
			this.player.clone(),
			this.cpu.clone(),this.playerField.clone(),
			this.cpuField.clone()
		)
	}
}