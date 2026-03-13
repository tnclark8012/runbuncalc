import { GameConfig } from './types';
import { POKEMON_NULL_CONFIG } from './null/config';

export enum RomType {
  PokemonNull = 'PokemonNull',
}

const ROM_TYPE_CONFIGS: Record<RomType, GameConfig> = {
  [RomType.PokemonNull]: POKEMON_NULL_CONFIG,
};

const ROM_TITLE_OFFSET = 0xA0;
const ROM_TITLE_LENGTH = 12;
const ROM_CODE_OFFSET = 0xAC;
const ROM_CODE_LENGTH = 4;

export function readRomTitle(romBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(romBuffer, ROM_TITLE_OFFSET, ROM_TITLE_LENGTH);
  return String.fromCharCode(...bytes).replace(/\0+$/, '');
}

export function readRomCode(romBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(romBuffer, ROM_CODE_OFFSET, ROM_CODE_LENGTH);
  return String.fromCharCode(...bytes).replace(/\0+$/, '');
}

export function getGameConfig(romType: RomType, romBuffer: ArrayBuffer): GameConfig {
  const config = ROM_TYPE_CONFIGS[romType];
  const title = readRomTitle(romBuffer);
  if (title !== config.romTitle) {
    const knownTitles = Object.values(ROM_TYPE_CONFIGS).map(c => c.romTitle);
    if (!knownTitles.includes(title)) {
      throw new Error(`Unrecognized ROM title "${title}". Known titles: ${knownTitles.join(', ')}`);
    }
    throw new Error(`ROM title "${title}" does not match expected "${config.romTitle}" for ${romType}`);
  }
  return config;
}
