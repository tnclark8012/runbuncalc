import { RomType } from './game-data';
import type { GameConfig } from './game-data/types';

export { RomType };
export type { GameConfig };

export interface GameState {
  romType: RomType;
  config: GameConfig;
  romBuffer: ArrayBuffer;
  parsedSave: ParsedSave;
}

export interface SaveSector {
  index: number;
  sectionId: number;
  checksum: number;
  signature: number;
  saveIndex: number;
  data: DataView;
}

export interface BoxPokemon {
  personality: number;
  otId: number;
  nickname: string;
  language: number;
  isBadEgg: boolean;
  hasSpecies: boolean;
  isEgg: boolean;
  otName: string;
  markings: number;
  species: number;
  heldItem: number;
  experience: number;
  ppBonuses: number;
  friendship: number;
  pokeball: number;
  hiddenNature: number;
  moves: [number, number, number, number];
  pp: [number, number, number, number];
  hpEV: number;
  attackEV: number;
  defenseEV: number;
  speedEV: number;
  spAttackEV: number;
  spDefenseEV: number;
  pokerus: number;
  metLocation: number;
  metLevel: number;
  metGame: number;
  otGender: number;
  hpIV: number;
  attackIV: number;
  defenseIV: number;
  speedIV: number;
  spAttackIV: number;
  spDefenseIV: number;
  altAbility: number;
}

export interface PartyPokemon extends BoxPokemon {
  status: number;
  level: number;
  hp: number;
  maxHP: number;
  attack: number;
  defense: number;
  speed: number;
  spAttack: number;
  spDefense: number;
}

export interface ParsedSave {
  partyCount: number;
  party: PartyPokemon[];
  pcBoxes: BoxPokemon[][];
}

export interface SpeciesInfo {
  growthRate: number;
  abilities: [number, number, number];
}
