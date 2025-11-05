import { A } from "@smogon/calc";
import { getActiveSets, saveActiveSets } from "../core/storage";
import { CustomSets, PokemonSet } from "../core/storage.contracts";

export function curHPPercentage(pokemon: A.Pokemon): number {
    return pokemon.curHP() / pokemon.maxHP();
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
