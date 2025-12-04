import { A, Field, I, Pokemon, Side, toID } from "@smogon/calc";
import { MoveName } from "@smogon/calc/dist/data/interface";
import { StatsTable } from "@smogon/calc/src";
import { TypeName } from "@smogon/calc/src/data/interface";
import { getFinalSpeed as calcGetFinalSpeed } from "@smogon/calc/src/mechanics/util";
import { gen } from "../configuration";
import { getActiveSets, saveActiveSets } from "../core/storage";
import { CustomSets, PokemonSet } from "../core/storage.contracts";
import { hasLifeSavingAbility, hasLifeSavingItem } from "./moveScoring";

export function canFlinch(move: MoveName): boolean {
	return ['Air Slash', 'Astonish', 'Bite', 'Bone Club', 'Bulldoze', 'Dark Pulse', 'Dragon Rush', 'Extrasensory', 'Fire Fang', 'Headbutt', 'Heart Stamp', 'Ice Fang', 'Iron Head', 'Needle Arm', 'Rock Slide', 'Rock Tomb', 'Rolling Kick', 'Rollout', 'Sky Attack', 'Stomp', 'Waterfall', 'Zen Headbutt'].includes(move);
}

export function curHPPercentage(pokemon: A.Pokemon): number {
	return pokemon.curHP() / pokemon.maxHP();
}

export function getPercentageOfMaxHP(pokemon: A.Pokemon, percentage: number): number {
	return Math.floor(pokemon.maxHP() * percentage / 100);
}

export function getHPAfterDamage(pokemon: Pokemon, currentHp: number, maxHp: number, damage: number): number {
	let newHp = Math.max(0, Math.min(maxHp, currentHp - Math.floor(damage)));
	if (hasLifeSavingItem(pokemon) || hasLifeSavingAbility(pokemon))
		newHp = Math.max(1, newHp);
	return newHp;
}

export function isFainted(pokemon: A.Pokemon): boolean {
	return pokemon.curHP() <= 0;
}

export function getFinalSpeed(pokemon: A.Pokemon, field: Field, side: Side): number {
	return calcGetFinalSpeed(gen, pokemon as any, field, side);
}

/** Applies an external (not from self) boost to stats. Doesn't impact Clear Body pokemon */
export function applyExternalBoost(pokemon: Pokemon, kind: keyof StatsTable, modifier: number): void {
	if (pokemon.hasAbility('Clear Body') && modifier < 0)
		return;

	applyBoost(pokemon.stats, kind, modifier);
}

export function hasAnyBoosts(pokemon: Pokemon): boolean {
	return Object.values(pokemon.boosts).some(boost => boost > 0);
}

export function applyBoost(stats: StatsTable, kind: keyof StatsTable, modifier: number): void {
	stats[kind] = Math.min(Math.max(-6, stats[kind] + modifier), 6);
}

export function consumeItem(pokemon: A.Pokemon): void {
	if (pokemon.item) {
		pokemon.item = undefined;
		if (pokemon.hasAbility('Unburden'))
			pokemon.abilityOn = true;
	}
}

export function hasBerry(pokemon: A.Pokemon): boolean {
	return !!(pokemon.item && pokemon.item.endsWith('Berry'));
}

export function getTypeEffectiveness(attackType: TypeName, type: TypeName): number;
export function getTypeEffectiveness(attackType: TypeName, defender: Pokemon): number;
export function getTypeEffectiveness(attackType: TypeName, defenderOrType: Pokemon | TypeName): number {
	let getEffectivenessOnType = (type: TypeName) => gen.types.get(toID(attackType))?.effectiveness[type]!;
	let types: TypeName[] = typeof defenderOrType === "string" ? [defenderOrType] : defenderOrType.types;
	let type1Effectiveness = getEffectivenessOnType(types[0]);
	let type2Effectiveness = types[1] ? getEffectivenessOnType(types[1]) : 1;
	return type1Effectiveness * type2Effectiveness;
}

export function isSuperEffective(attackType: TypeName, defender: Pokemon): boolean {
	return getTypeEffectiveness(attackType, defender) > 1;
}

export function isGrounded(pokemon: Pokemon, field: Field): boolean {
	return (field.isGravity || pokemon.hasItem('Iron Ball') ||
		(!pokemon.hasType('Flying') &&
			!pokemon.hasAbility('Levitate') &&
			!pokemon.hasItem('Air Balloon')));
}

function forEachSet(setCallback: (set: PokemonSet, setName: string, pokemonName: string) => void | boolean | undefined): CustomSets | undefined {
	const sets = getActiveSets();
	for (let pokemonName in sets) {
		for (let setName in sets[pokemonName]) {
			const set = sets[pokemonName][setName];
			if (setCallback(set, setName, pokemonName)) {
				return;
			}
		}
	}

	return sets;
}

export function updateSets(setCallback: (set: PokemonSet, setName: string, pokemonName: string) => void | boolean | undefined): void {
	let updated = forEachSet(setCallback);
	if (updated) {
		saveActiveSets(updated);
	}
}

export function damagePokemonWithPercentageOfMaxHp(pokemon: Pokemon, percentage: number): Pokemon {
	let damageToTake = Math.floor(pokemon.maxHP() * percentage);
	return pokemon.clone({ curHP: Math.max(pokemon.curHP() - damageToTake, 0) });
}

export function processCartesianProduct<T>(arrays: T[][], callback: (combinationValues: T[]) => boolean | void): number {
	let totalCombinations = 0;
	const perOptionIndices = new Array(arrays.length).fill(0);
	while (perOptionIndices[0] < arrays[0].length) {
		totalCombinations++;
		const combinationValues = perOptionIndices.map((optionIndex, moveIndex) => arrays[moveIndex][optionIndex]);
		if (callback(combinationValues) === true)
			return totalCombinations;

		for (let arrayIndex = perOptionIndices.length - 1; arrayIndex >= 0; arrayIndex--) {
			if (perOptionIndices[arrayIndex] < arrays[arrayIndex].length - 1) {
				perOptionIndices[arrayIndex]++;
				break;
			} else if (arrayIndex > 0) {
				perOptionIndices[arrayIndex] = 0;
			}
			else {
				// All done!
				perOptionIndices[0] = arrays[0].length;
			}
		}
	}

	return totalCombinations;
}

export function isSoundBased(move: MoveName): boolean {
	return ['Boomburst', 'Clanging Scales', 'Hyper Voice', 'Metal Sound', 'Parting Shot', 'Relic Song', 'Roar of Time', 'Round', 'Snarl', 'Snore', 'Uproar'].includes(move);
}

export function isTargetImmuneToMoveKind(move: MoveName, target: Pokemon, field: Field): boolean {
	if (isPowderMove(move) && (target.hasType('Grass') || target.hasAbility('Overcoat') || target.hasItem('Safety Goggles'))) {
		return true;
	}

	if (target.hasType('Electric') && ['Thunder Wave', 'Glare'].includes(move))
		return true;

	return false;
}

function isPowderMove(move: MoveName): boolean {
	return ['Cotton Spore', 'Magic Powder', 'Poison Powder', 'Powder', 'Rage Powder', 'Spore', 'Sleep Powder', 'Spore', 'Stun Spore'].includes(move);
}

export type LegacyStatsTable = {
  hp?: number;
  at?: number;
  df?: number;
  sa?: number;
  sd?: number;
  sp?: number;
};

export function convertIVsFromCustomSetToPokemon(ivs: LegacyStatsTable | undefined): I.StatsTable {
	return {
		hp: ivs?.hp ?? 31,
		atk: ivs?.at ?? 31,
		def: ivs?.df ?? 31,
		spa: ivs?.sa ?? 31,
		spd: ivs?.sd ?? 31,
		spe: ivs?.sp ?? 31,
	};
}