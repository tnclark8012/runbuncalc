import { Pokemon } from "@smogon/calc";
import { SpeciesSet } from "./PokemonSetDetails";

export function toSpeciesSet(pokemon: Pokemon): SpeciesSet {
  return {
    species: pokemon.species.name,
    set: {
      ability: pokemon.ability,
      item: pokemon.item,
      moves: pokemon.moves,
      nature: pokemon.nature,
      ivs: {
        at: pokemon.ivs.atk,
        df: pokemon.ivs.def,
        hp: pokemon.ivs.hp,
        sa: pokemon.ivs.spa,
        sd: pokemon.ivs.spd,
        sp: pokemon.ivs.spe,
      },
      level: pokemon.level,
    }
  };
}