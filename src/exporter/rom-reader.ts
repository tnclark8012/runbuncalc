import { SpeciesInfo } from './types';

// ROM address offsets for Pokemon Null (pokeemerald-expansion)
// Empirically determined by searching for known base stats patterns
const SPECIES_INFO_ROM_OFFSET = 0x3DB1F4;
const SPECIES_INFO_ENTRY_SIZE = 36;
const GROWTH_RATE_OFFSET = 21;
const ABILITIES_OFFSET = 24;

export function readSpeciesInfo(romBuffer: ArrayBuffer, speciesId: number): SpeciesInfo {
  const view = new DataView(romBuffer);
  const base = SPECIES_INFO_ROM_OFFSET + speciesId * SPECIES_INFO_ENTRY_SIZE;

  const growthRate = view.getUint8(base + GROWTH_RATE_OFFSET);
  const abilities: [number, number, number] = [
    view.getUint16(base + ABILITIES_OFFSET, true),
    view.getUint16(base + ABILITIES_OFFSET + 2, true),
    view.getUint16(base + ABILITIES_OFFSET + 4, true),
  ];

  return {growthRate, abilities};
}

export function getAbilityId(romBuffer: ArrayBuffer, speciesId: number, altAbility: number): number {
  const info = readSpeciesInfo(romBuffer, speciesId);
  return info.abilities[altAbility] || info.abilities[0];
}
