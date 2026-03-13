import { GameConfig } from '../types';

export const POKEMON_NULL_CONFIG: GameConfig = {
  romTitle: 'POKEMON EMER',
  romCode: 'BPEE',

  // ROM species data (empirically determined for Pokemon Null / pokeemerald-expansion)
  speciesInfoRomOffset: 0x3DB1F4,
  speciesInfoEntrySize: 36,
  growthRateOffset: 21,
  abilitiesOffset: 24,

  // Pokemon struct layout (pokeemerald-expansion has an extra byte before nickname/OT)
  boxMonSize: 84,
  partyMonSize: 104,
  substructureOffset: 36,
  nicknameOffset: 9,
  nicknameLength: 11,
  otNameOffset: 22,
  otNameLength: 10,

  // SaveBlock1 offsets
  partyCountOffset: 0x234,
  partyDataOffset: 0x238,

  // PokemonStorage offsets
  pcBoxesOffset: 4,
  boxesCount: 24,
  monsPerBox: 30,
};
