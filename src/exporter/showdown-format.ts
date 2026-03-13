import { calcLevelFromRom } from './experience';
import { ABILITIES, ITEMS, MOVES, NATURES, SPECIES_NAMES } from './lookup-tables';
import { getAbilityId } from './rom-reader';
import { BoxPokemon, PartyPokemon } from './types';

const HIDDEN_POWER_TYPES = [
  'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug',
  'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric',
  'Psychic', 'Ice', 'Dragon', 'Dark',
];

function getHiddenPowerType(mon: BoxPokemon): string {
  const typeIndex = Math.floor(
    ((mon.hpIV % 2) +
      2 * (mon.attackIV % 2) +
      4 * (mon.defenseIV % 2) +
      8 * (mon.speedIV % 2) +
      16 * (mon.spAttackIV % 2) +
      32 * (mon.spDefenseIV % 2)) *
      5 / 21
  );
  return HIDDEN_POWER_TYPES[typeIndex] ?? 'Unknown';
}

function getNature(mon: BoxPokemon): string {
  if (mon.hiddenNature !== 26) {
    return NATURES[mon.hiddenNature] ?? 'Unknown';
  }
  return NATURES[mon.personality % 25] ?? 'Unknown';
}

function getSpeciesName(speciesId: number): string {
  return SPECIES_NAMES[speciesId - 1] ?? `Unknown(${speciesId})`;
}

function getItemName(itemId: number): string | undefined {
  if (itemId === 0) return undefined;
  return ITEMS[itemId - 1];
}

function getAbilityName(mon: BoxPokemon, romBuffer: ArrayBuffer): string {
  const abilityId = getAbilityId(romBuffer, mon.species, mon.altAbility);
  if (abilityId === 0) return 'Unknown';
  const name = ABILITIES[abilityId - 1];
  if (!name || name === 'None') {
    return ABILITIES[0] ?? 'Unknown'; // fallback
  }
  return name;
}

function formatIVLine(mon: BoxPokemon): string {
  const ivs: string[] = [];
  if (mon.hpIV !== 31) ivs.push(`${mon.hpIV} HP`);
  if (mon.attackIV !== 31) ivs.push(`${mon.attackIV} Atk`);
  if (mon.defenseIV !== 31) ivs.push(`${mon.defenseIV} Def`);
  if (mon.spAttackIV !== 31) ivs.push(`${mon.spAttackIV} SpA`);
  if (mon.spDefenseIV !== 31) ivs.push(`${mon.spDefenseIV} SpD`);
  if (mon.speedIV !== 31) ivs.push(`${mon.speedIV} Spe`);
  // If all IVs are 31, omit the line
  if (ivs.length === 0) return '';
  return `IVs: ${ivs.join(' / ')}`;
}

function formatMoveLine(mon: BoxPokemon): string {
  const lines: string[] = [];
  for (const moveId of mon.moves) {
    const moveName = MOVES[moveId];
    if (!moveName) continue;
    if (moveName === 'Hidden Power') {
      lines.push(`- Hidden Power [${getHiddenPowerType(mon)}]`);
    } else {
      lines.push(`- ${moveName}`);
    }
  }
  return lines.join('\n');
}

export function formatPartyMon(mon: PartyPokemon, romBuffer: ArrayBuffer): string {
  const parts: string[] = [];
  let header = getSpeciesName(mon.species);
  const item = getItemName(mon.heldItem);
  if (item) header += ` @ ${item}`;
  parts.push(header);
  parts.push(`Ability: ${getAbilityName(mon, romBuffer)}`);
  parts.push(`Level: ${mon.level}`);
  parts.push(`${getNature(mon)} Nature`);
  const ivLine = formatIVLine(mon);
  if (ivLine) parts.push(ivLine);
  const movesStr = formatMoveLine(mon);
  if (movesStr) parts.push(movesStr);
  return parts.join('\n');
}

export function formatPCMon(mon: BoxPokemon, romBuffer: ArrayBuffer): string {
  const parts: string[] = [];
  let header = getSpeciesName(mon.species);
  const item = getItemName(mon.heldItem);
  if (item) header += ` @ ${item}`;
  parts.push(header);
  parts.push(`Ability: ${getAbilityName(mon, romBuffer)}`);
  const level = calcLevelFromRom(mon.experience, mon.species, romBuffer);
  parts.push(`Level: ${level}`);
  parts.push(`${getNature(mon)} Nature`);
  const ivLine = formatIVLine(mon);
  if (ivLine) parts.push(ivLine);
  const movesStr = formatMoveLine(mon);
  if (movesStr) parts.push(movesStr);
  return parts.join('\n');
}

export function formatAllPokemon(
  party: PartyPokemon[],
  pcBoxes: BoxPokemon[][],
  romBuffer: ArrayBuffer,
): string {
  const sections: string[] = [];

  for (const mon of party) {
    sections.push(formatPartyMon(mon, romBuffer));
  }

  for (const box of pcBoxes) {
    for (const mon of box) {
      sections.push(formatPCMon(mon, romBuffer));
    }
  }

  return sections.join('\n\n');
}
