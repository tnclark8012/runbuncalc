import { GameConfig, SpeciesInfo } from './types';

export function readSpeciesInfo(config: GameConfig, romBuffer: ArrayBuffer, speciesId: number): SpeciesInfo {
  const view = new DataView(romBuffer);
  const base = config.speciesInfoRomOffset + speciesId * config.speciesInfoEntrySize;

  const growthRate = view.getUint8(base + config.growthRateOffset);
  const abilities: [number, number, number] = [
    view.getUint16(base + config.abilitiesOffset, true),
    view.getUint16(base + config.abilitiesOffset + 2, true),
    view.getUint16(base + config.abilitiesOffset + 4, true),
  ];

  return {growthRate, abilities};
}

export function getAbilityId(config: GameConfig, romBuffer: ArrayBuffer, speciesId: number, altAbility: number): number {
  const info = readSpeciesInfo(config, romBuffer, speciesId);
  return info.abilities[altAbility] || info.abilities[0];
}
