// Type declarations for external modules

declare module "https://tnclark8012.github.io/RBDex/pokedex.js" {
  export interface PokemonAbilities {
    "0": string;
    "1"?: string;
    "H"?: string;
  }

  export interface PokemonData {
    name: string;
    abilities: PokemonAbilities;
  }

  export interface BattlePokedex {
    [lowercaseName: string]: PokemonData;
  }

  export const BattlePokedex: BattlePokedex;
}
declare type PokedexModule = typeof import('https://tnclark8012.github.io/RBDex/pokedex.js');