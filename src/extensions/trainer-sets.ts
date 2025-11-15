import { Pokemon } from "@smogon/calc";
import { gen } from "./configuration";
import { TrainerSets } from "./trainer-sets.data";
import { PokemonSet } from "./trainer-sets.types";

export const Trainers = initializeTrainerSets();
export const PokemonIndexToTrainerMap = (() => {
  const trainerPokemonIndexMap = new Map<number, string>();
  for (const [pokemonName, trainerSets] of Object.entries(TrainerSets)) {
    for (const [trainerName, setValue] of Object.entries(trainerSets as {[key: string]: PokemonSet})) {
      trainerPokemonIndexMap.set(setValue.index, trainerName);
    }
  }
  return trainerPokemonIndexMap;
})();

function initializeTrainerSets() {
  const trainerParties: {
    [trainerName: string]: Pokemon[];
  } = {};

  const trainerBoxes: Map<string, Map<number, Pokemon>> = new Map();

  for (const [pokemonName, trainers] of Object.entries(TrainerSets as {[key: string]: any})) {
      for (const trainerName in trainers) {
        const pokemonSet = trainers[trainerName];
        const pokemon = new Pokemon(gen, pokemonName, {
          level: pokemonSet.level,
          ability: pokemonSet.ability,
          moves: pokemonSet.moves,
          nature: pokemonSet.nature,
          item: pokemonSet.item,
          ivs: pokemonSet.ivs,
        });
        if (!trainerBoxes.has(trainerName))
          trainerBoxes.set(trainerName, new Map());

        trainerBoxes.get(trainerName)!.set(pokemonSet.index, pokemon);
      }
    }

    for (const [trainerName, boxMap] of trainerBoxes.entries()) {
      const sortedPokemons = Array.from(boxMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map((entry) => entry[1]);
      trainerParties[trainerName] = sortedPokemons;
    }

  return trainerParties;
}

export function getTrainerNameByIndex(index: number): string {
  if (!PokemonIndexToTrainerMap.has(index)) {
    alert(`No trainer found for Pokemon index ${index}`);
  }
  return PokemonIndexToTrainerMap.get(index)!;
}