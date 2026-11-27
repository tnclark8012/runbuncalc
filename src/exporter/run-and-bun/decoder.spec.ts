import { gzipSync } from 'zlib';
import { parseSetCollectionJson } from '../../extensions/core/collection-import';
import { getActiveCollection, saveActiveCollectionName, saveSetCollection } from '../../extensions/core/storage';
import { snapshotToBoxExport } from './box-export';
import { decodeRunAndBunMemory, decodeRunAndBunSnapshot } from './decoder';
import { decompressJohnGbaState, JOHN_GBA_STATE_SIZE, SnapshotMemory } from './memory';
import { readPokemon } from './pokemon';
import { RunAndBunData } from './game-data';
import { REFERENCE_ROM_SHA256 } from './tables';

const SB1 = 0x02025000;
const SB2 = 0x02024000;
const STORAGE = 0x02029000;
const PARTY = 0x02023A98;
const BOX = STORAGE + 4 + (2 * 30 + 4) * 80;
const QUANTITY_KEY = 0xA55A;
const POCKETS = [[0x4E8, 130], [0xA08, 33], [0xA8C, 128], [0x810, 60], [0x900, 66], [0x7A4, 27], [0x6F0, 45], [0xC8C, 50]];

function gbaText(text: string): Uint8Array {
  return Uint8Array.from([...text].map(char => {
    if (char === ' ') return 0;
    if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 65 + 0xBB;
    if (char >= 'a' && char <= 'z') return char.charCodeAt(0) - 97 + 0xD5;
    throw new Error(`Unsupported fixture character ${char}.`);
  }).concat(0xFF));
}

function permutations(values: number[]): number[][] {
  return values.length === 0 ? [[]] : values.flatMap(value =>
    permutations(values.filter(other => other !== value)).map(tail => [value, ...tail]));
}
const PHYSICAL_ORDERS = permutations([0, 1, 2, 3]);

function fixture() {
  const bytes = new Uint8Array(JOHN_GBA_STATE_SIZE);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 10, true);
  const offset = (address: number) => address >= 0x03000000 ? 0x1DF + address - 0x03000000 : 0x85DF + address - 0x02000000;
  const u8 = (address: number, value: number) => view.setUint8(offset(address), value);
  const u16 = (address: number, value: number) => view.setUint16(offset(address), value, true);
  const u32 = (address: number, value: number) => view.setUint32(offset(address), value, true);
  u32(0x03005D9C, SB1);
  u32(0x03005DA0, SB2);
  u32(0x03005DA4, STORAGE);
  u32(SB2 + 0xA4, 0x12340000 | QUANTITY_KEY);
  for (const [index, [start, capacity]] of POCKETS.entries()) {
    u32(0x020393E0 + index * 8, SB1 + start);
    u8(0x020393E0 + index * 8 + 4, capacity);
    for (let slot = 0; slot < capacity; slot++) u16(SB1 + start + slot * 4 + 2, QUANTITY_KEY);
  }
  u16(SB1 + 0x7A4, 1);
  u16(SB1 + 0x7A4 + 2, 2 ^ QUANTITY_KEY);
  bytes.set(gbaText('Fainted'), offset(STORAGE + 0x8344 + 2 * 9));
  u8(STORAGE + 0x83C2 + 2, 7);

  const writePokemon = (address: number, personality = 0, party = true, pp = 12) => {
    const size = party ? 100 : 80;
    bytes.fill(0, offset(address), offset(address) + size);
    u32(address, personality);
    u32(address + 4, 0x12345678);
    bytes.set(gbaText('Test'), offset(address + 8));
    u8(address + 18, 2);
    u8(address + 19, 2);
    bytes.set(gbaText('Trainer'), offset(address + 20));
    const logical = new Uint8Array(48);
    const data = new DataView(logical.buffer);
    data.setUint16(0, 1, true);
    data.setUint16(2, 1, true);
    data.setUint32(4, 117360, true);
    data.setUint8(9, 70);
    data.setUint8(10, 26);
    data.setUint16(12, 1, true);
    data.setUint8(20, pp);
    logical.set([4, 8, 12, 16, 20, 24], 24);
    data.setUint32(40, ((1 << 1) | (2 << 6) | (3 << 11) | (4 << 16) | (5 << 21) | (6 << 26)) >>> 0, true);
    const shuffled = new Uint8Array(48);
    PHYSICAL_ORDERS[personality % 24].forEach((logicalIndex, physicalIndex) =>
      shuffled.set(logical.subarray(logicalIndex * 12, logicalIndex * 12 + 12), physicalIndex * 12));
    const encrypted = new DataView(shuffled.buffer);
    let checksum = 0;
    for (let i = 0; i < 48; i += 2) checksum = (checksum + encrypted.getUint16(i, true)) & 0xFFFF;
    u16(address + 28, checksum);
    for (let i = 0; i < 48; i += 4) u32(address + 32 + i, encrypted.getUint32(i, true) ^ personality ^ 0x12345678);
    if (party) {
      u8(address + 84, 50);
      u32(address + 80, 8);
      u16(address + 86, 90);
      [120, 80, 70, 60, 50, 40].forEach((stat, index) => u16(address + 88 + index * 2, stat));
    }
  };
  u8(0x02023A95, 1);
  u8(SB1 + 0x234, 6);
  writePokemon(PARTY);
  writePokemon(BOX, 23, false, 1);
  writePokemon(0x02023CF0, 7, true, 56);
  u8(0x020233E4, 2);
  for (let battler = 0; battler < 2; battler++) {
    const address = 0x020233FC + battler * 92;
    u16(address, 1);
    u16(address + 32, 22);
    u16(address + 48, 1);
    u16(0x020235CC + battler * 2, 0xFFFF);
  }
  u16(0x02023668 + 6, 1);
  u8(0x02023668 + 8, 2);
  u8(0x02023668 + 16, 0);
  u8(0x02023668 + 17, 0xA3);
  u8(0x02023668 + 25, 0);
  u32(0x02023A18, 0x02038000);
  u32(0x02038014, 0x02038100);
  u16(0x02038104, 400);
  return { bytes, view, offset, u8, u16, u32, writePokemon };
}

describe('Run & Bun John GBA decoder', () => {
  it('uses the live party, preserves box locations, and counts bag plus owned held items only once', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    const player = snapshot.player;
    expect(player.party).toHaveLength(1);
    expect(player.party[0].condition).toMatchObject({ hp: 90, majorStatusRaw: 8, source: 'party-memory' });
    expect(player.party[0].ivs).toEqual({ hp: 1, attack: 2, defense: 3, speed: 4, specialAttack: 5, specialDefense: 6 });
    expect(player.boxes[2]).toMatchObject({ name: 'Fainted', wallpaperId: 7 });
    expect(player.boxes[2].pokemon[0]).toMatchObject({
      location: { kind: 'box', box: 2, slot: 4 }, level: 50, nature: { name: 'Careful' },
      condition: { source: 'box-withdrawal-derivation', hp: 106, majorStatusRaw: 0 },
    });
    expect(player.boxes[2].pokemon[0].moves[0]).toMatchObject({ pp: 1, maxPp: 35 });
    expect(player.boxes[2].pokemon[0].condition.stats).toEqual({
      hp: 106, attack: 56, defense: 57, speed: 54, specialAttack: 67, specialDefense: 83,
    });
    expect(player.bag[5].items[0]).toMatchObject({ slot: 0, quantity: 2 });
    expect(player.itemTotals).toEqual([{ item: { id: 1, name: 'Poke Ball' }, inBag: 2, held: 2, total: 4 }]);
    expect(snapshot.coverage.progress).toBe('not-decoded');
  });

  it('decodes all 24 record permutations and rejects corrupted Pokemon checksums', () => {
    const f = fixture();
    for (let personality = 0; personality < 24; personality++) {
      f.writePokemon(BOX, personality, false);
      const mon = readPokemon(new SnapshotMemory(f.bytes), new RunAndBunData(), BOX, { kind: 'box', box: 2, slot: 4 })!;
      expect(mon.nature.id).toBe(personality % 25);
      expect(mon.ivs.specialDefense).toBe(6);
      expect(mon.species.name).toBe('Bulbasaur');
    }
    f.u8(BOX + 32, f.bytes[f.offset(BOX + 32)] ^ 1);
    expect(() => decodeRunAndBunMemory(f.bytes)).toThrow('checksum');
  });

  it('preserves confirmed restrictions, move sentinels, 16-bit AI scores and uncertain opponent PP', () => {
    const f = fixture();
    const battle = decodeRunAndBunMemory(f.bytes).battleMemory;
    expect(battle).toMatchObject({ activity: 'unknown', phase: 'unknown', ai: { moveScores: [400, 0, 0, 0] } });
    expect(battle.battlers[0]).toMatchObject({
      side: 'player', lastUsedMoveRaw: 0xFFFF, lastUsedMove: null,
      restrictions: { encoreTurns: 3, encoreTimerByteRaw: 0xA3, protectUseCount: 2, firstTurnOutRaw: 0 },
    });
    expect(battle.opponentParty[0].moves[0]).toMatchObject({ pp: 56, maxPp: null });
  });

  it('round-trips duplicates and snapshot metadata through the actual collection storage path', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    const { collection, warnings } = snapshotToBoxExport(snapshot, 'Test import');
    expect(warnings).toEqual([]);
    const data = collection['Test import'];
    expect(Object.keys(data.customSets.Bulbasaur)).toEqual(['Test', 'Test 2']);
    expect(data.party).toEqual(['Bulbasaur (Test)']);
    expect(data.customSets.Bulbasaur.Test).toMatchObject({ evs: { hp: 4, sp: 16 }, ivs: { at: 2, sa: 5 } });
    expect(data.customSets.Bulbasaur.Test.moves).toEqual(['Pound', '', '', '']);
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    try {
      saveSetCollection(parseSetCollectionJson(JSON.stringify(collection)));
      saveActiveCollectionName('Test import');
      expect(getActiveCollection()).toEqual(data);
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('numbers duplicate nicknames without taking another Pokemon original nickname or losing party references', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    snapshot.player.party[0].nickname = 'Sparky';
    snapshot.player.party.push({
      ...snapshot.player.party[0], id: 'party:1', location: { kind: 'party', slot: 1 },
    });
    snapshot.player.boxes[2].pokemon[0].nickname = 'Sparky 2';
    const { collection } = snapshotToBoxExport(snapshot);
    const data = Object.values(parseSetCollectionJson(JSON.stringify(collection)))[0];
    expect(Object.keys(data.customSets.Bulbasaur)).toEqual(['Sparky', 'Sparky 3', 'Sparky 2']);
    expect(data.party).toEqual(['Bulbasaur (Sparky)', 'Bulbasaur (Sparky 3)']);
    expect(snapshot.player.party.map(pokemon => pokemon.nickname)).toEqual(['Sparky', 'Sparky']);
    expect(snapshot.player.boxes[2].pokemon[0].location).toEqual({ kind: 'box', box: 2, slot: 4 });
  });

  it('allows the same nickname for different species', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    snapshot.player.boxes[2].pokemon[0].species = { id: 2, name: 'Ivysaur' };
    const data = Object.values(snapshotToBoxExport(snapshot).collection)[0];
    expect(Object.keys(data.customSets.Bulbasaur)).toEqual(['Test']);
    expect(Object.keys(data.customSets.Ivysaur)).toEqual(['Test']);
  });

  it.each([['', 'Bulbasaur'], ['   ', 'Bulbasaur'], ['prototype', 'prototype 2'], ['__proto__', '__proto__ 2']])(
    'reports a usable fallback for nickname "%s"', (nickname, expected) => {
      const f = fixture();
      const snapshot = decodeRunAndBunMemory(f.bytes);
      snapshot.player.party[0].nickname = nickname;
      const { collection, warnings } = snapshotToBoxExport(snapshot);
      expect(Object.values(collection)[0].party).toEqual([`Bulbasaur (${expected})`]);
      expect(warnings).toHaveLength(1);
      expect(() => parseSetCollectionJson(JSON.stringify(collection))).not.toThrow();
    },
  );

  it('adds each mega form to the box holding its mega stone, without adding it to the party', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    snapshot.player.party[0].species = { id: 6, name: 'Charizard' };
    const data = Object.values(snapshotToBoxExport(snapshot).collection)[0];
    const base = data.customSets.Charizard.Test;
    expect(data.customSets['Charizard-Mega-X'].Test).toEqual({ ...base, ability: 'Tough Claws', item: 'Charizardite X' });
    expect(data.customSets['Charizard-Mega-Y'].Test).toEqual({ ...base, ability: 'Drought', item: 'Charizardite Y' });
    expect(data.customSets.Bulbasaur).toBeDefined();
    expect(Object.keys(data.customSets)).toHaveLength(4);
    expect(data.party).toEqual(['Charizard (Test)']);
  });

  it('distinguishes As One variants for the calculator while preserving raw game names', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    snapshot.player.party[0].ability = { id: 266, name: 'As One', slot: 0 };
    const { collection } = snapshotToBoxExport(snapshot);
    expect(Object.values(collection)[0].customSets.Bulbasaur.Test.ability).toBe('As One (Glastrier)');
    expect(Object.values(collection)[0].gameStateSnapshot!.player.party[0].ability.name).toBe('As One');
  });

  it('reports invalid pointers and bag quantities instead of returning empty or partial success', () => {
    const f = fixture();
    f.u32(0x03005DA4, 0x08000000);
    expect(() => decodeRunAndBunMemory(f.bytes)).toThrow('Invalid RAM range');
    f.u32(0x03005DA4, STORAGE);
    f.u16(SB1 + 0x7A4 + 2, QUANTITY_KEY);
    expect(() => decodeRunAndBunMemory(f.bytes)).toThrow('Invalid item quantity');
    f.u16(SB1 + 0x7A4, 0);
    f.u16(SB1 + 0x4E8, 1);
    f.u16(SB1 + 0x4E8 + 2, 2 ^ QUANTITY_KEY);
    expect(() => decodeRunAndBunMemory(f.bytes)).toThrow('Invalid item quantity or pocket');
  });

  it('uses bundled ability slots and exact boxed level thresholds without ROM bytes', () => {
    const data = new RunAndBunData();
    expect(data.speciesAbility(1, 0)).toEqual({id: 65, name: 'Overgrow'});
    expect(data.speciesAbility(1, 1)).toEqual(data.speciesAbility(1, 0));
    expect(data.speciesAbility(1, 2)).toEqual({id: 34, name: 'Chlorophyll'});
    expect(data.ability(266)).toEqual({id: 266, name: 'As One'});
    expect(data.level(1, 117359)).toBe(49);
    expect(data.level(1, 117360)).toBe(50);
    expect(data.level(1, 0)).toBe(1);
    expect(data.level(1, 2000000)).toBe(100);
    expect(() => data.ability(268)).toThrow('Unknown Run & Bun ability');
    expect(() => data.speciesAbility(1, 3)).toThrow('Invalid ability slot');
  });

  it('refuses to silently drop a decoded move that the calculator cannot represent', () => {
    const f = fixture();
    const snapshot = decodeRunAndBunMemory(f.bytes);
    snapshot.player.party[0].moves[0].move = { id: 778, name: 'Unsupported move' };
    expect(() => snapshotToBoxExport(snapshot)).toThrow('Calculator does not recognize move');
    expect(snapshot.player.party[0].moves[0].move.name).toBe('Unsupported move');
  });

  it('decompresses valid snapshots and rejects previews, truncation, corrupt gzip and oversized payloads', async () => {
    const f = fixture();
    const snapshot = await decodeRunAndBunSnapshot(gzipSync(f.bytes), {stateFileName: 'test.jg9'});
    expect(snapshot.player.party).toHaveLength(1);
    expect(snapshot.player.party[0].ability).toMatchObject({id: 65, name: 'Overgrow'});
    expect(snapshot.source).toEqual({
      format: 'john-gba-v10', stateFileName: 'test.jg9', gameDataRomSha256: REFERENCE_ROM_SHA256,
    });
    await expect(decompressJohnGbaState(Uint8Array.from([0xFF, 0xD8]))).rejects.toThrow('not a .sav or .js preview');
    await expect(decompressJohnGbaState(gzipSync(f.bytes.subarray(0, 100)))).rejects.toThrow('Truncated');
    const corrupt = gzipSync(f.bytes);
    corrupt[corrupt.length - 8] ^= 0xFF;
    await expect(decompressJohnGbaState(corrupt)).rejects.toThrow('Could not decompress');
    await expect(decompressJohnGbaState(gzipSync(new Uint8Array(JOHN_GBA_STATE_SIZE + 1)))).rejects.toThrow('exceeds');
  });

  it.each(['null', '{}', '{"Box":{"customSets":{},"party":["missing"]}}', '{"Box":{"customSets":{"Bulbasaur":{"Test":{"level":999}}},"party":[]}}'])(
    'rejects malformed box imports before storage: %s', text => {
      expect(() => parseSetCollectionJson(text)).toThrow();
    },
  );
});
