import { Field, Move, Pokemon } from '@smogon/calc';
import { PartyOrderSwitchStrategy } from './switchStrategy.partyOrder';
import { Side } from '@smogon/calc/src';
import { MoveName } from '@smogon/calc/dist/data/interface';

export interface VolatileStatus {
	/** The move being charged (e.g., Bounce, Fly, Dig, Dive) */
	chargingMove?: MoveName;
	/** Whether the Pokemon is invulnerable (semi-invulnerable during charge turn) */
	invulnerable?: boolean;
	/** Move that locks the Pokemon in (e.g., Outrage, Petal Dance) */
	lockedMove?: MoveName;
	/** Turns remaining for the current volatile status */
	turnsRemaining?: number;
	/** Unlocks Belch */
	berryConsumed?: boolean;
	/** Flinched */
	flinched?: boolean;
}

export interface MoveConsideration {
	result: MoveResult;
	kos: boolean;
	lowestRollTotalHitsHpPercentage: number;
	highestRollTotalHitsHpPercentage: number;
	aiMon: Pokemon;
	playerMon: Pokemon;
}

export interface MoveResult {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	lowestRollPerHitDamage: number;
	lowestRollPerHitHpPercentage: number;
	highestRollPerHitDamage: number;
	highestRollPerHitHpPercentage: number;
	damageRolls: number[];
}

export interface CPUMoveConsideration extends MoveConsideration {
	/**
	 * @see MoveScore.addPotentialScore
	 * 
   * Consider this in the AI doc:
   *  Highest damaging move: +6 (80%), +8 (20%)  
   * 
   * Now consider the AI Petalburg Woods Grunt Carvanha sees this against a Starly:
   * Bite 55.8 - 70.5% (19, 19, 19, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 24)
   * Water Pulse 52.9 - 64.7% (18, 18, 19, 19, 19, 19, 19, 19, 19, 21, 21, 21, 21, 21, 21, 22)
   * Aqua Jet 38.2 - 47%
   * Poison Fang 32.3 - 41.1%
   * 
   * When calcing AI behavior, what are the move scores if that was the single rule?
   * 
   * Water Pulse beats Bite in 24 of 256 cases
   * Probability: 9.375%
   *
   * Bite [90.625% * 80% = 72.5%]: +6, [90.625% * 20% = 18.125%]: +8, 9.375%: 0
   * Water Pulse [9.375% * 80% = 7.5%]: +6, [9.375% * 20% = 1.875%]: +8, 90.625%: 0
   * Aqua Jet 0
   * Poison Fang 0
   * 
   * For Water Pusle, this value will by 0.09275
   * @param potentialChance 
   * @param modifier 
   * @param percentChance 
	 */
	isHighestDamagingMove: boolean;
	isDamagingMove: boolean;
	aiIsFaster: boolean;
	aiIsSlower: boolean;
	aiIsFasterAfterPlayerParalysis: boolean;
	aiPartner?: Pokemon;
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
		public firstTurnOut?: boolean,
		public volatileStatus?: VolatileStatus) {

	}

	public clone(): PokemonPosition {
		return new PokemonPosition(
			this.pokemon.clone(),
			this.firstTurnOut,
			this.volatileStatus ? { ...this.volatileStatus } : undefined
		);
	}

	public isSamePokemon(other: PokemonPosition): boolean {
		return this.pokemon.equals(other.pokemon);
	}

	public toString(): string {
		let status = this.volatileStatus && Object.keys(this.volatileStatus).length > 0 ? JSON.stringify(this.volatileStatus) : '';
		const str = [
			this.pokemon.name,
			this.pokemon.status || '',
			`(${this.pokemon.curHP()}/${this.pokemon.maxHP()})`,
			this.pokemon.item ? `@ ${this.pokemon.item!}` : '',
			status
		].join(' ')
		return str;
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
		public readonly switchStrategy?: SwitchStrategy) {
		this.switchStrategy = new PartyOrderSwitchStrategy(() => this);
	}

	public clone(): Trainer {
		return new Trainer(
			this.name,
			this.active.map(p => p.clone()),
			this.party.map(p => p.clone()),
			this.switchStrategy);
	}

	public equals(other: Trainer): boolean {
		return this.name === other.name;
	}

	public getActivePokemon(pokemon: Pokemon): PokemonPosition | undefined {
		return this.active.find(p => p.pokemon.equals(pokemon));
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
		switchStrategy?: SwitchStrategy) {
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
		switchStrategy?: SwitchStrategy) {
		super('Player', active, party, switchStrategy);
	}
}

export class BattleFieldState {
	constructor(
		public readonly player: Trainer,
		public readonly cpu: Trainer,
		public readonly field: Field,
		public turnNumber: number = 0) {

	}

	public get playerField(): Field {
		return this.field;
	}

	public get playerSide(): Side {
		return this.field.attackerSide;
	}

	public get cpuField(): Field {
		return this.field.swap();
	}

	public get cpuSide(): Side {
		return this.field.defenderSide;
	}

	public get isDoubles(): boolean {
		return this.field.gameType === 'Doubles';
	}

	public getfield(pokemonPosition: PokemonPosition): Field {
		if (this.player.active.some(position => position.isSamePokemon(pokemonPosition))) {
			return this.playerField;
		}
		if (this.cpu.active.some(position => position.isSamePokemon(pokemonPosition))) {
			return this.cpuField;
		}
		throw new Error('Pokemon not found in the battle state');
	}

	public getSide(pokemonPosition: PokemonPosition): Side {
		if (this.player.active.some(position => position.isSamePokemon(pokemonPosition))) {
			return this.playerSide;
		}
		else if (this.cpu.active.some(position => position.isSamePokemon(pokemonPosition))) {
			return this.cpuSide;
		}

		throw new Error('Pokemon not found in the battle state');
	}

	public getTrainer(trainer: Trainer): Trainer {
		if (trainer.equals(this.player)) {
			return this.player;
		} else if (trainer.equals(this.cpu)) {
			return this.cpu;
		} else {
			throw new Error(`Trainer ${trainer.name} not found in the battle state`);
		}
	}

	public getOpponent(trainer: Trainer): Trainer {
		if (trainer.equals(this.player)) {
			return this.cpu;
		} else if (trainer.equals(this.cpu)) {
			return this.player;
		} else {
			throw new Error(`Trainer ${trainer.name} not found in the battle state`);
		}
	}

	public clone(): BattleFieldState {
		return new BattleFieldState(
			this.player.clone(),
			this.cpu.clone(),
			this.field.clone(),
			this.turnNumber);
	}

	public toString(): string {
		const describePosition = (slot: number, pokemon: PokemonPosition | undefined) => {
			if (!pokemon) return '';
			return [`[${slot}]`, pokemon.toString()].join(' ')
		};

		const describePartyPokemon = (pokemon: Pokemon) => {
			return `${pokemon.name} (${pokemon.curHP()}/${pokemon.maxHP()})`;
		}

		return `BattleFieldState
			${this.player.name}
				${describePosition(0, this.player.active[0])}
				${describePosition(1, this.player.active[1])}

			${this.cpu.name}
				${describePosition(0, this.cpu.active[0])}
				${describePosition(1, this.cpu.active[1])}
`			;
	}
}