import { Pokemon } from "@smogon/calc";
import { gen } from "./configuration";
import { TrainerSets } from "./trainer-sets.data";

export const Trainers = initializeTrainerSets();

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