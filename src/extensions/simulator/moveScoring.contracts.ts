import { Field, Move, Pokemon } from '@smogon/calc';
import { PartyOrderSwitchStrategy } from './switchStrategy.partyOrder';

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
	aiWillOHKOPlayer: boolean;
	aiOutdamagesPlayer: boolean;
    lastTurnCPUMove: Move | undefined;
    aiMonFirstTurnOut: boolean;
    field: Field
}

export interface PlayerMoveConsideration extends MoveConsideration {
	kosThroughRequiredLifesaver: boolean;
	attackerDiesToRecoil: boolean;
	guaranteedToFail: boolean;
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
		public readonly name: string,
		public readonly active: PokemonPosition[],
		public readonly party: Pokemon[],
		public readonly switchStrategy?: SwitchStrategy)
	{
		this.switchStrategy = new PartyOrderSwitchStrategy(() => this);
	}

	public clone(): Trainer {
		return new Trainer(
			this.name,
			this.active.map(p => p.clone()),
			this.party.map(p => p.clone()),
			this.switchStrategy);
	}
}

export class CpuTrainer extends Trainer {
	constructor(name: string, active: PokemonPosition[], party: Pokemon[], switchStrategy?: SwitchStrategy);
	constructor(
		active: PokemonPosition[],
		party: Pokemon[],
		switchStrategy?: SwitchStrategy);
	constructor(
		nameOrActive: string | PokemonPosition[],
		activeOrParty: PokemonPosition[] | Pokemon[],
		partyOrSwitchStrategy?: Pokemon[] | SwitchStrategy,
		switchStrategy?: SwitchStrategy)
	{
		if (typeof nameOrActive === 'string') {
			super(nameOrActive, activeOrParty as PokemonPosition[], partyOrSwitchStrategy as Pokemon[], switchStrategy);
		} else {
			super('CPU', nameOrActive as PokemonPosition[], activeOrParty as Pokemon[], partyOrSwitchStrategy as SwitchStrategy);
		}
	}
}

export class PlayerTrainer extends Trainer {
	constructor(
		active: PokemonPosition[],
		party: Pokemon[],
		switchStrategy?: SwitchStrategy)
	{
		super('Player', active, party, switchStrategy);
	}
}

export type BattleFormat = 'singles' | 'doubles';
export class BattleFieldState {
	constructor(
		public readonly battleFormat: BattleFormat,
		public readonly player: Trainer,
		public readonly cpu: Trainer,
		public readonly playerField: Field,
		public readonly cpuField: Field) {
		
	}

	public get isDoubles(): boolean {
		return this.battleFormat === 'doubles';
	}

	public clone(): BattleFieldState {
		return new BattleFieldState(
			this.battleFormat,
			this.player.clone(),
			this.cpu.clone(),
			this.playerField.clone(),
			this.cpuField.clone()
		)
	}
}