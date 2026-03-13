import { getGameConfig, RomType } from './game-data';
import { extractPokemon } from './pokemon-data';
import { GameState, SaveSector } from './types';

const SECTOR_SIZE = 4096;
const DATA_SIZE = 3968;
const FOOTER_OFFSET = 0xFF4;
const SAVE_SIGNATURE = 0x08012025;
const SECTIONS_PER_SLOT = 14;

export interface SaveBlocks {
  saveBlock2: DataView;
  saveBlock1: DataView;
  pokemonStorage: DataView;
}

function parseSector(buffer: ArrayBuffer, sectorIndex: number): SaveSector {
  const offset = sectorIndex * SECTOR_SIZE;
  const view = new DataView(buffer, offset, SECTOR_SIZE);
  return {
    index: sectorIndex,
    sectionId: view.getUint16(FOOTER_OFFSET, true),
    checksum: view.getUint16(FOOTER_OFFSET + 2, true),
    signature: view.getUint32(FOOTER_OFFSET + 4, true),
    saveIndex: view.getUint32(FOOTER_OFFSET + 8, true),
    data: new DataView(buffer, offset, DATA_SIZE),
  };
}

function validateChecksum(sector: SaveSector): boolean {
  let sum = 0;
  for (let i = 0; i < DATA_SIZE; i += 4) {
    sum = (sum + sector.data.getUint32(i, true)) >>> 0;
  }
  const computed = ((sum & 0xFFFF) + (sum >>> 16)) & 0xFFFF;
  return computed === sector.checksum;
}

function concatenateSections(
  sectors: SaveSector[],
  sectionIdStart: number,
  sectionIdEnd: number
): DataView {
  const parts: Uint8Array[] = [];
  for (let id = sectionIdStart; id <= sectionIdEnd; id++) {
    const sector = sectors.find(s => s.sectionId === id);
    if (!sector) throw new Error(`Missing section ${id}`);
    parts.push(new Uint8Array(sector.data.buffer, sector.data.byteOffset, DATA_SIZE));
  }
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }
  return new DataView(combined.buffer);
}

function parseSaveBlocks(buffer: ArrayBuffer): SaveBlocks {
  if (buffer.byteLength !== 131072) {
    throw new Error(`Expected 128KB save file, got ${buffer.byteLength} bytes`);
  }

  // Parse all 28 save sectors (2 slots × 14 sections)
  const slotA: SaveSector[] = [];
  const slotB: SaveSector[] = [];
  for (let i = 0; i < SECTIONS_PER_SLOT; i++) {
    slotA.push(parseSector(buffer, i));
    slotB.push(parseSector(buffer, SECTIONS_PER_SLOT + i));
  }

  // Validate signatures
  for (const sector of [...slotA, ...slotB]) {
    if (sector.signature !== SAVE_SIGNATURE) {
      throw new Error(`Invalid signature in sector ${sector.index}: 0x${sector.signature.toString(16)}`);
    }
  }

  // Active slot = higher save index
  const activeSlot = slotA[0].saveIndex >= slotB[0].saveIndex ? slotA : slotB;

  // Validate checksums
  const corruptedSections: number[] = [];
  for (const sector of activeSlot) {
    if (!validateChecksum(sector)) {
      corruptedSections.push(sector.sectionId);
    }
  }
  if (corruptedSections.length > 0) {
    console.warn(`Corrupted sections: ${corruptedSections.join(', ')}`);
  }

  return {
    saveBlock2: concatenateSections(activeSlot, 0, 0),
    saveBlock1: concatenateSections(activeSlot, 1, 4),
    pokemonStorage: concatenateSections(activeSlot, 5, 13),
  };
}

export function parseSaveFile(romType: RomType, savBuffer: ArrayBuffer, romBuffer: ArrayBuffer): GameState {
  const config = getGameConfig(romType, romBuffer);
  const blocks = parseSaveBlocks(savBuffer);
  const parsedSave = extractPokemon(config, blocks);
  return { romType, config, romBuffer, parsedSave };
}
