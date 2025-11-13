import { Field, Pokemon, Generations, GenerationNum } from '@smogon/calc';
import { State } from '@smogon/calc/src';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from './moveScoring.contracts';

/**
 * Serialized representation of a PokemonPosition
 */
export interface SerializedPokemonPosition {
	pokemon: State.Pokemon;
	firstTurnOut?: boolean;
}

/**
 * Serialized representation of a Trainer
 */
export interface SerializedTrainer {
	name: string;
	active: SerializedPokemonPosition[];
	party: State.Pokemon[];
}

/**
 * Serialized representation of BattleFieldState
 * This is a lightweight format that can be easily stored and transmitted
 */
export interface SerializedBattleFieldState {
	player: SerializedTrainer;
	cpu: SerializedTrainer;
	field: State.Field;
	turnNumber: number;
}

/**
 * Serializes a Pokemon to its State representation
 */
function serializePokemon(pokemon: Pokemon): State.Pokemon {
	return {
		name: pokemon.name,
		level: pokemon.level,
		ability: pokemon.ability,
		abilityOn: pokemon.abilityOn,
		isDynamaxed: pokemon.isDynamaxed,
		isSaltCure: pokemon.isSaltCure,
		alliesFainted: pokemon.alliesFainted,
		item: pokemon.item,
		gender: pokemon.gender,
		nature: pokemon.nature,
		ivs: { ...pokemon.ivs },
		evs: { ...pokemon.evs },
		boosts: { ...pokemon.boosts },
		originalCurHP: pokemon.originalCurHP,
		status: pokemon.status,
		teraType: pokemon.teraType,
		toxicCounter: pokemon.toxicCounter,
		moves: pokemon.moves.slice(),
		overrides: pokemon.species,
	};
}

/**
 * Serializes a PokemonPosition
 */
function serializePokemonPosition(position: PokemonPosition): SerializedPokemonPosition {
	return {
		pokemon: serializePokemon(position.pokemon),
		firstTurnOut: position.firstTurnOut,
	};
}

/**
 * Serializes a Trainer
 */
function serializeTrainer(trainer: Trainer): SerializedTrainer {
	return {
		name: trainer.name,
		active: trainer.active.map(serializePokemonPosition),
		party: trainer.party.map(serializePokemon),
	};
}

/**
 * Serializes a Field to its State representation
 */
function serializeField(field: Field): State.Field {
	return {
		gameType: field.gameType,
		weather: field.weather,
		terrain: field.terrain,
		isMagicRoom: field.isMagicRoom,
		isWonderRoom: field.isWonderRoom,
		isTrickRoom: field.isTrickRoom,
		isGravity: field.isGravity,
		isAuraBreak: field.isAuraBreak,
		isFairyAura: field.isFairyAura,
		isDarkAura: field.isDarkAura,
		isBeadsOfRuin: field.isBeadsOfRuin,
		isSwordOfRuin: field.isSwordOfRuin,
		isTabletsOfRuin: field.isTabletsOfRuin,
		isVesselOfRuin: field.isVesselOfRuin,
		attackerSide: { ...field.attackerSide },
		defenderSide: { ...field.defenderSide },
	};
}

/**
 * Serializes a BattleFieldState to a lightweight JSON-compatible format
 */
export function serializeBattleFieldState(state: BattleFieldState): SerializedBattleFieldState {
	return {
		player: serializeTrainer(state.player),
		cpu: serializeTrainer(state.cpu),
		field: serializeField(state.field),
		turnNumber: state.turnNumber,
	};
}

/**
 * Deserializes a Pokemon from its State representation
 */
function deserializePokemon(gen: GenerationNum, pokemonState: State.Pokemon): Pokemon {
	return new Pokemon(Generations.get(gen), pokemonState.name, pokemonState);
}

/**
 * Deserializes a PokemonPosition
 */
function deserializePokemonPosition(gen: GenerationNum, position: SerializedPokemonPosition): PokemonPosition {
	return new PokemonPosition(
		deserializePokemon(gen, position.pokemon),
		position.firstTurnOut
	);
}

/**
 * Deserializes a Trainer
 */
function deserializeTrainer(gen: GenerationNum, trainer: SerializedTrainer): Trainer {
	const active = trainer.active.map(pos => deserializePokemonPosition(gen, pos));
	const party = trainer.party.map(poke => deserializePokemon(gen, poke));
	
	if (trainer.name === 'Player') {
		return new PlayerTrainer(active, party);
	} else if (trainer.name === 'CPU') {
		return new CpuTrainer(active, party);
	} else {
		return new Trainer(trainer.name, active, party);
	}
}

/**
 * Deserializes a BattleFieldState from its serialized format
 * @param gen The generation number to use for Pokemon/Field construction (default: 9)
 * @param serialized The serialized state
 */
export function deserializeBattleFieldState(
	serialized: SerializedBattleFieldState,
	gen: GenerationNum = 9
): BattleFieldState {
	const player = deserializeTrainer(gen, serialized.player);
	const cpu = deserializeTrainer(gen, serialized.cpu);
	const field = new Field(serialized.field);
	
	return new BattleFieldState(player, cpu, field, serialized.turnNumber);
}

/**
 * Converts a BattleFieldState to a JSON string
 */
export function battleFieldStateToJSON(state: BattleFieldState): string {
	return JSON.stringify(serializeBattleFieldState(state));
}

/**
 * Reconstructs a BattleFieldState from a JSON string
 * @param json The JSON string
 * @param gen The generation number to use (default: 9)
 */
export function battleFieldStateFromJSON(json: string, gen: GenerationNum = 9): BattleFieldState {
	const serialized = JSON.parse(json) as SerializedBattleFieldState;
	return deserializeBattleFieldState(serialized, gen);
}
