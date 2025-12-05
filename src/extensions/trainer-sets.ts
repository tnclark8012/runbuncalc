import { Pokemon } from "@smogon/calc";
import { gen } from "./configuration";
import { TrainerNames, TrainerSets } from "./trainer-sets.data";
import { PokemonSet } from "./trainer-sets.types";

export const OpposingTrainer = (trainerName: TrainerNames) => initializeTrainerSets()[trainerName];
let orderedTrainerNames: TrainerNames[];

export function nextTrainerIndex(currentTrainerIndex: number): number {
  return currentTrainerIndex === orderedTrainerNames.length - 1 ? currentTrainerIndex : currentTrainerIndex + 1;
}

export function previousTrainerIndex(currentTrainerIndex: number): number {
  return currentTrainerIndex === 0 ? 0 : currentTrainerIndex - 1;
}

export function getTrainerNameByTrainerIndex(index: number): TrainerNames {
  if (!orderedTrainerNames!) {
    initializeTrainerSets();
  }
  return orderedTrainerNames![index];
}

export function getTrainerNameByPokemonIndex(index: number): TrainerNames {
  if (!PokemonIndexToTrainerMap.has(index)) {
    alert(`No trainer found for Pokemon index ${index}`);
  }
  return PokemonIndexToTrainerMap.get(index)!;
}

export function getTrainerIndexBySetSelection(selection: { species: string; setName: string }): number {
  return orderedTrainerNames.findIndex(name => name === selection.setName);
}

export function getTrainerNameBySetSelection(selection: { species: string; setName: string }): string {
  // Implementation for finding trainer name by set selection goes here
  return getTrainerNameByPokemonIndex((TrainerSets as any)[selection.species][selection.setName].index);
}

export const PokemonIndexToTrainerMap = (() => {
  const trainerPokemonIndexMap = new Map<number, TrainerNames>();
  for (const [pokemonName, trainerSets] of Object.entries(TrainerSets)) {
    for (const [trainerName, setValue] of Object.entries(trainerSets as { [key: string]: PokemonSet })) {
      trainerPokemonIndexMap.set(setValue.index, trainerName as TrainerNames);
    }
  }
  return trainerPokemonIndexMap;
})();

function initializeTrainerSets() {
  const trainerParties: {
    [trainerName: string]: Pokemon[];
  } = {};

  const trainerBoxes: Map<string, Map<number, Pokemon>> = new Map();
  const trainerNameToMinIndex: Map<string, number> = new Map();
  for (const [pokemonName, trainers] of Object.entries(TrainerSets as { [key: string]: any })) {
    for (const trainerName in trainers) {
      let normalizedTrainerName = trainerName.trim(); // Multiple pokemon of the same species have trainers like "Bob", "Bob "
      const pokemonSet = trainers[trainerName];
      if (!trainerNameToMinIndex.has(normalizedTrainerName) || pokemonSet.index < trainerNameToMinIndex.get(normalizedTrainerName)!)
        trainerNameToMinIndex.set(normalizedTrainerName, pokemonSet.index);

      const pokemon = new Pokemon(gen, pokemonName, {
        level: pokemonSet.level,
        ability: pokemonSet.ability,
        moves: pokemonSet.moves,
        nature: pokemonSet.nature,
        item: pokemonSet.item,
        ivs: pokemonSet.ivs,
      });
      if (!trainerBoxes.has(normalizedTrainerName))
        trainerBoxes.set(normalizedTrainerName, new Map());

      trainerBoxes.get(normalizedTrainerName)!.set(pokemonSet.index, pokemon);
    }
  }

  const orderedTrainers = Array.from(trainerNameToMinIndex.entries())
    .sort((a,b) => a[1] - b[1])
    .map(entry => entry[0]);
  orderedTrainerNames = orderedTrainers as TrainerNames[];

  for (const [trainerName, boxMap] of trainerBoxes.entries()) {
    const sortedPokemons = Array.from(boxMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) => entry[1]);
    trainerParties[trainerName] = sortedPokemons;
  }


  return trainerParties;
}