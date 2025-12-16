import { Pokemon } from "@smogon/calc";
import { SpeciesSet } from "./PokemonSetDetails";

export function toSpeciesSet(pokemon: Pokemon): SpeciesSet {
  return {
    species: pokemon.species.name, set: {
      ability: pokemon.ability,
      item: pokemon.item,
      moves: pokemon.moves,
      nature: pokemon.nature,
      ivs: pokemon.ivs,
      level: pokemon.level,
    }
  };
}