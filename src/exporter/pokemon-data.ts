import { decodeGBAString } from './charmap';
import { SPECIES_NAMES } from './lookup-tables';
import { SaveBlocks } from './save-parser';
import { BoxPokemon, GameConfig, ParsedSave, PartyPokemon } from './types';

const MAX_SPECIES_ID = SPECIES_NAMES.length;

/**
 * Substructure order lookup table (24 permutations).
 * Index = personality % 24, value = [Growth, Attacks, EVs, Misc] position indices.
 */
const SUBSTRUCTURE_ORDER: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0],
];

function readBytes(view: DataView, offset: number, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = view.getUint8(offset + i);
  }
  return bytes;
}

function readBoxMon(config: GameConfig, view: DataView, offset: number): BoxPokemon | null {
  const personality = view.getUint32(offset, true);
  const otId = view.getUint32(offset + 4, true);

  if (personality === 0 && otId === 0) return null;

  // Header fields
  const nickname = decodeGBAString(readBytes(view, offset + config.nicknameOffset, config.nicknameLength), config.nicknameLength);

  const language = view.getUint8(offset + config.nicknameOffset + config.nicknameLength - 1);
  const flags = view.getUint8(offset + config.nicknameOffset + config.nicknameLength);
  const otName = decodeGBAString(readBytes(view, offset + config.otNameOffset, config.otNameLength), config.otNameLength);
  const markings = view.getUint8(offset + config.substructureOffset - 4);

  // Decrypt substructures
  const key = (otId ^ personality) >>> 0;
  const pSel = SUBSTRUCTURE_ORDER[personality % 24];
  const dataStart = offset + config.substructureOffset;

  const ss: number[][] = [[], [], [], []];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 3; i++) {
      ss[s].push((view.getUint32(dataStart + pSel[s] * 12 + i * 4, true) ^ key) >>> 0);
    }
  }

  // Growth (ss0)
  const species = ss[0][0] & 0xFFFF;
  if (species === 0 || species > MAX_SPECIES_ID) return null;

  const heldItem = ss[0][0] >>> 16;
  const experience = ss[0][1];
  const ppBonuses = ss[0][2] & 0xFF;
  const friendship = (ss[0][2] >>> 8) & 0xFF;
  const pokeball = (ss[0][2] >>> 16) & 0x1F;
  const hiddenNature = (ss[0][2] >>> 21) & 0x1F;

  // Attacks (ss1)
  const moves: [number, number, number, number] = [
    ss[1][0] & 0xFFFF,
    ss[1][0] >>> 16,
    ss[1][1] & 0xFFFF,
    ss[1][1] >>> 16,
  ];
  const pp: [number, number, number, number] = [
    ss[1][2] & 0xFF,
    (ss[1][2] >>> 8) & 0xFF,
    (ss[1][2] >>> 16) & 0xFF,
    ss[1][2] >>> 24,
  ];

  // EVs/Condition (ss2)
  const hpEV = ss[2][0] & 0xFF;
  const attackEV = (ss[2][0] >>> 8) & 0xFF;
  const defenseEV = (ss[2][0] >>> 16) & 0xFF;
  const speedEV = ss[2][0] >>> 24;
  const spAttackEV = ss[2][1] & 0xFF;
  const spDefenseEV = (ss[2][1] >>> 8) & 0xFF;

  // Misc (ss3)
  const pokerus = ss[3][0] & 0xFF;
  const metLocation = (ss[3][0] >>> 8) & 0xFF;
  const metFlags = ss[3][0] >>> 16;
  const metLevel = metFlags & 0x7F;
  const metGame = (metFlags >>> 7) & 0xF;
  const otGender = (metFlags >>> 15) & 0x1;

  const ivFlags = ss[3][1];
  const hpIV = ivFlags & 0x1F;
  const attackIV = (ivFlags >>> 5) & 0x1F;
  const defenseIV = (ivFlags >>> 10) & 0x1F;
  const speedIV = (ivFlags >>> 15) & 0x1F;
  const spAttackIV = (ivFlags >>> 20) & 0x1F;
  const spDefenseIV = (ivFlags >>> 25) & 0x1F;

  const ribbonFlags = ss[3][2];
  const altAbility = (ribbonFlags >>> 29) & 3;

  return {
    personality,
    otId,
    nickname,
    language,
    isBadEgg: !!(flags & 1),
    hasSpecies: !!((flags >>> 1) & 1),
    isEgg: !!((flags >>> 2) & 1),
    otName,
    markings,
    species,
    heldItem,
    experience,
    ppBonuses,
    friendship,
    pokeball,
    hiddenNature,
    moves,
    pp,
    hpEV,
    attackEV,
    defenseEV,
    speedEV,
    spAttackEV,
    spDefenseEV,
    pokerus,
    metLocation,
    metLevel,
    metGame,
    otGender,
    hpIV,
    attackIV,
    defenseIV,
    speedIV,
    spAttackIV,
    spDefenseIV,
    altAbility,
  };
}

function readPartyMon(config: GameConfig, view: DataView, offset: number): PartyPokemon | null {
  const boxMon = readBoxMon(config, view, offset);
  if (!boxMon) return null;

  const statsStart = offset + config.boxMonSize;
  return {
    ...boxMon,
    status: view.getUint32(statsStart, true),
    level: view.getUint8(statsStart + 4),
    hp: view.getUint16(statsStart + 6, true),
    maxHP: view.getUint16(statsStart + 8, true),
    attack: view.getUint16(statsStart + 10, true),
    defense: view.getUint16(statsStart + 12, true),
    speed: view.getUint16(statsStart + 14, true),
    spAttack: view.getUint16(statsStart + 16, true),
    spDefense: view.getUint16(statsStart + 18, true),
  };
}

export function extractPokemon(config: GameConfig, blocks: SaveBlocks): ParsedSave {
  const sb1 = blocks.saveBlock1;
  const storage = blocks.pokemonStorage;

  // Party
  const partyCount = sb1.getUint32(config.partyCountOffset, true);
  const party: PartyPokemon[] = [];
  for (let i = 0; i < partyCount && i < 6; i++) {
    const mon = readPartyMon(config, sb1, config.partyDataOffset + i * config.partyMonSize);
    if (mon && !mon.isBadEgg) party.push(mon);
  }

  // PC Boxes
  const pcBoxes: BoxPokemon[][] = [];
  for (let box = 0; box < config.boxesCount; box++) {
    const boxMons: BoxPokemon[] = [];
    for (let slot = 0; slot < config.monsPerBox; slot++) {
      const offset = config.pcBoxesOffset + (box * config.monsPerBox + slot) * config.boxMonSize;
      if (offset + config.boxMonSize > storage.byteLength) break;
      const mon = readBoxMon(config, storage, offset);
      if (mon && !mon.isBadEgg) boxMons.push(mon);
    }
    pcBoxes.push(boxMons);
  }

  return {partyCount, party, pcBoxes};
}
