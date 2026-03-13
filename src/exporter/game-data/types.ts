export interface GameConfig {
  /** ROM header game title at offset 0xA0 (12 ASCII bytes, trimmed) */
  romTitle: string;
  /** ROM header game code at offset 0xAC (4 ASCII bytes) */
  romCode: string;

  // ROM species data offsets
  speciesInfoRomOffset: number;
  speciesInfoEntrySize: number;
  growthRateOffset: number;
  abilitiesOffset: number;

  // Pokemon struct layout
  boxMonSize: number;
  partyMonSize: number;
  substructureOffset: number;
  nicknameOffset: number;
  nicknameLength: number;
  otNameOffset: number;
  otNameLength: number;

  // SaveBlock1 offsets
  partyCountOffset: number;
  partyDataOffset: number;

  // PokemonStorage offsets
  pcBoxesOffset: number;
  boxesCount: number;
  monsPerBox: number;
}
