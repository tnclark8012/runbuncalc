// Type definitions for SETDEX_SS from gen8.js

export interface PokemonSet {
  level: number;
  ability: string;
  moves: string[];
  nature: string;
  item: string;
  index: number;
  ivs?: {
    hp?: number;
    at?: number;
    df?: number;
    sa?: number;
    sd?: number;
    sp?: number;
  };
  evs?: {
    hp?: number;
    at?: number;
    df?: number;
    sa?: number;
    sd?: number;
    sp?: number;
  };
}

export interface TrainerSets {
  [trainerName: string]: PokemonSet;
}

export interface SetDex {
  [pokemonName: string]: TrainerSets;
}

// Declare the global variable from gen8.js
declare global {
  var SETDEX_SS: SetDex;
}

export {};
