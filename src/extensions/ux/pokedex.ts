import { Pokemon } from "@smogon/calc";
import type { BattlePokedex } from "https://tnclark8012.github.io/RBDex/pokedex.js";
import { loadCommonJSScript, loadGlobalScripts } from "../core/external-script-loader";
import { Dex } from "../rb-dex.types";

export interface PokedexEntry {
  name: string;
  id: string;
  abilities: string[];
  moves: string[];
}

export class Pokedex {
  public static async getEntry(pokemon: Pokemon): Promise<PokedexEntry | undefined> {
    await ensurePokedexLoaded();
    const dex = (window as any).Dex as Dex;
    const entry = dex.species.get(pokemon.species.id); // Ensure species data is loaded
    if (!entry) return undefined;
    
    const preEvolution1 = entry.prevo ? dex.species.get(entry.prevo) : undefined;
    const preEvolution2 = preEvolution1?.prevo ? dex.species.get(preEvolution1.prevo) : undefined;
    const baseLearnset = (window as any).BattleLearnsets?.[pokemon.species.id]?.learnset || {};
    const preEvolution1Learnset = preEvolution1 ? (window as any).BattleLearnsets?.[preEvolution1.id]?.learnset || {} : {};
    const preEvolution2Learnset = preEvolution2 ? (window as any).BattleLearnsets?.[preEvolution2.id]?.learnset || {} : {};
    const moveIds = Object.keys({ ...baseLearnset, ...preEvolution1Learnset, ...preEvolution2Learnset });
    const moves = moveIds.map(id => dex.moves.get(id)?.name || id);
    moves.sort();
    return {
      name: entry.name,
      id: pokemon.species.id,
      abilities: Object.values(entry.abilities),
      moves,
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

async function ensurePokedexLoaded(this: any): Promise<BattlePokedex> {
  if (!(ensurePokedexLoaded as any)._pokedex) {
    const pokedexModule = await loadCommonJSScript<PokedexModule>("https://tnclark8012.github.io/RBDex/pokedex.js");
    (ensurePokedexLoaded as any)._pokedex = pokedexModule.BattlePokedex;
    (window as any).BattlePokedex = pokedexModule.BattlePokedex;
    await loadGlobalScripts([
      "https://play.pokemonshowdown.com/config/config.js",
      "https://tnclark8012.github.io/RBDex/battledata.js",
      "https://tnclark8012.github.io/RBDex/search-index.js",
      "https://tnclark8012.github.io/RBDex/learnsets.js",
      "https://tnclark8012.github.io/RBDex/moves.js",
      "https://play.pokemonshowdown.com/data/abilities.js",
      "https://play.pokemonshowdown.com/data/typechart.js",
      "https://play.pokemonshowdown.com/data/aliases.js",
      "https://tnclark8012.github.io/RBDex/battle-dex-search.js",
      "https://tnclark8012.github.io/RBDex/search.js",
    ]);
  }

  return (ensurePokedexLoaded as any)._pokedex;
}