import { decodeGBAString } from '../charmap';
import { readBattleMemory } from './battle';
import { decompressJohnGbaState, SnapshotMemory } from './memory';
import { readPokemon } from './pokemon';
import { RunAndBunData } from './game-data';
import { REFERENCE_ROM_SHA256 } from './tables';
import type { GameStateSnapshot, SnapshotPokemon } from './types';

const POCKETS = [
  { id: 1, name: 'general', offset: 0x4E8, capacity: 130 },
  { id: 2, name: 'medicine', offset: 0xA08, capacity: 33 },
  { id: 3, name: 'held-and-battle-items', offset: 0xA8C, capacity: 128 },
  { id: 4, name: 'tm-and-hm', offset: 0x810, capacity: 60 },
  { id: 5, name: 'berries', offset: 0x900, capacity: 66 },
  { id: 6, name: 'balls', offset: 0x7A4, capacity: 27 },
  { id: 7, name: 'key-items', offset: 0x6F0, capacity: 45 },
  { id: 8, name: 'mega-stones', offset: 0xC8C, capacity: 50 },
];

export function decodeRunAndBunMemory(
  decompressedState: Uint8Array, source: Partial<GameStateSnapshot['source']> = {},
): GameStateSnapshot {
  const memory = new SnapshotMemory(decompressedState);
  const data = new RunAndBunData();
  const sb1 = memory.pointer(0x03005D9C, 0xD54);
  const sb2 = memory.pointer(0x03005DA0, 0xA8);
  const storage = memory.pointer(0x03005DA4, 0x83D0);
  const partyCount = memory.u8(0x02023A95);
  if (partyCount > 6) throw new Error(`Invalid player party count ${partyCount}.`);
  const party: SnapshotPokemon[] = [];
  for (let slot = 0; slot < partyCount; slot++) {
    const pokemon = readPokemon(memory, data, 0x02023A98 + slot * 100, { kind: 'party', slot });
    if (!pokemon) throw new Error(`Empty Pokemon record in occupied party slot ${slot}.`);
    party.push(pokemon);
  }
  const currentBox = memory.u8(storage);
  if (currentBox >= 14) throw new Error(`Invalid current box index ${currentBox}.`);
  const boxes = Array.from({ length: 14 }, (_, box) => {
    const pokemon: SnapshotPokemon[] = [];
    for (let slot = 0; slot < 30; slot++) {
      const mon = readPokemon(memory, data, storage + 4 + (box * 30 + slot) * 80, { kind: 'box', box, slot });
      if (mon) pokemon.push(mon);
    }
    return {
      index: box, name: decodeGBAString(memory.bytes(storage + 0x8344 + box * 9, 9), 9),
      wallpaperId: memory.u8(storage + 0x83C2 + box), pokemon,
    };
  });
  const quantityKey = memory.u32(sb2 + 0xA4) & 0xFFFF;
  const bag = POCKETS.map((pocket, index) => {
    const descriptor = 0x020393E0 + index * 8;
    const address = memory.pointer(descriptor, pocket.capacity * 4);
    if (address !== sb1 + pocket.offset || memory.u8(descriptor + 4) !== pocket.capacity) {
      throw new Error(`Bag pocket ${pocket.id} does not match the researched Run & Bun layout.`);
    }
    const items: GameStateSnapshot['player']['bag'][number]['items'] = [];
    for (let slot = 0; slot < pocket.capacity; slot++) {
      const item = data.item(memory.u16(address + slot * 4));
      const quantity = memory.u16(address + slot * 4 + 2) ^ quantityKey;
      if (!item) {
        if (quantity !== 0) throw new Error(`Empty bag slot has a nonzero quantity in ${pocket.name}.`);
      } else {
        if (quantity === 0 || data.itemPocket(item.id) !== pocket.id) {
          throw new Error(`Invalid item quantity or pocket in ${pocket.name}, slot ${slot}.`);
        }
        items.push({ slot, item, quantity });
      }
    }
    return { id: pocket.id, name: pocket.name, capacity: pocket.capacity, items };
  });
  const totals = new Map<number, GameStateSnapshot['player']['itemTotals'][number]>();
  const addItem = (item: NonNullable<SnapshotPokemon['heldItem']>, count: number, kind: 'inBag' | 'held') => {
    const total = totals.get(item.id) ?? { item, inBag: 0, held: 0, total: 0 };
    total[kind] += count;
    total.total += count;
    totals.set(item.id, total);
  };
  for (const pocket of bag) for (const entry of pocket.items) addItem(entry.item, entry.quantity, 'inBag');
  for (const mon of [...party, ...boxes.flatMap(box => box.pokemon)]) {
    if (mon.heldItem) addItem(mon.heldItem, 1, 'held');
  }
  return {
    schemaVersion: 1, game: 'run-and-bun',
    source: { ...source, format: 'john-gba-v10', gameDataRomSha256: REFERENCE_ROM_SHA256 },
    coverage: {
      party: 'decoded', boxes: 'decoded', bag: 'decoded', progress: 'not-decoded',
      battle: 'partial-memory-with-unverified-activity-and-phase',
    },
    limitations: [
      'This decoder uses bundled tables for the supported Run & Bun revision and John GBA format-10 layout; other revisions are not verified.',
      'Battle activity and snapshot phase are not decoded. Battle memory may be stale outside battle.',
      'Current-turn protection, all status masks, delayed effects, suppression and consumption are not fully decoded.',
      'Side and field timer meanings are ROM-traced; nonzero samples have not all been verified.',
      'AI scores may be uncomputed or stale; the RNG seed does not predict the next decision.',
      'Opponent party PP is preserved, but its maximum is not inferred from stored PP Ups.',
      'Box HP and status describe verified withdrawal conversion, not PC access legality or a PP refill.',
      'Progress, encounter limits and individual Nuzlocke eligibility are not inferred.',
    ],
    player: { party, boxes, currentBox, bag, itemTotals: Array.from(totals.values()).sort((a, b) => a.item.id - b.item.id) },
    battleMemory: readBattleMemory(memory, data),
  };
}

export async function decodeRunAndBunSnapshot(
  stateBytes: Uint8Array, source: Partial<GameStateSnapshot['source']> = {},
): Promise<GameStateSnapshot> {
  return decodeRunAndBunMemory(await decompressJohnGbaState(stateBytes), source);
}
