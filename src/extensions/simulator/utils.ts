import { A, toID } from "@smogon/calc";
import { StatsTable } from "@smogon/calc/src";
import { BattleFieldState } from "./moveScoring.contracts";
import { IBattleFieldStateVisitor } from "./battle-field-state-visitor";
import { Type, TypeEffectiveness, TypeName } from "@smogon/calc/src/data/interface";
import { getActiveSets, saveActiveSets } from "../core/storage";
import { CustomSets, PokemonSet } from "../core/storage.contracts";
import { gen } from "../configuration";

export function curHPPercentage(pokemon: A.Pokemon): number {
    return pokemon.curHP() / pokemon.maxHP();
}

export function isFainted(pokemon: A.Pokemon): boolean {
    return pokemon.curHP() <= 0;
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

export function getTypeEffectiveness(attackType: TypeName, type: TypeName): TypeEffectiveness {
    return gen.types.get(toID(attackType))?.effectiveness[type]!;
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
