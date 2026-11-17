import { Pokemon } from "@smogon/calc";
import { pokedex } from "@runbuncalc/rbdex-data";

export interface PokedexEntry {
  name: string;
  id: string;
  abilities: string[];
  moves: string[];
}

export class Pokedex {
  public static async getEntry(pokemon: Pokemon): Promise<PokedexEntry | undefined> {
    const entry = pokedex[pokemon.species.id];
    if (!entry) return undefined;
    return {
      name: entry.name,
      id: pokemon.species.id,
      abilities: [...entry.abilities],
      moves: [...entry.moves],
    };
  }
}

export async function getAbilitiesForPokemon(pokemon: Pokemon): Promise<string[]> {
  let entry = await Pokedex.getEntry(pokemon);
  let abilities = entry?.abilities;

  if (abilities) {
    return Object.values(abilities);
  }
  
  return [];
}