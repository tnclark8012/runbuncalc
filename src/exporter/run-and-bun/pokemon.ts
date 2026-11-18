import { decodeGBAString } from '../charmap';
import { SnapshotMemory } from './memory';
import { RunAndBunData } from './game-data';
import type { PokemonLocation, SnapshotPokemon, Stats } from './types';

const ORDERS = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0],
];

export function readPokemon(
  memory: SnapshotMemory, data: RunAndBunData, address: number, location: PokemonLocation,
): SnapshotPokemon | null {
  const isBox = location.kind === 'box';
  const raw = memory.bytes(address, isBox ? 80 : 100);
  if (raw.every(byte => byte === 0)) return null;
  const personality = memory.u32(address);
  const originalTrainerId = memory.u32(address + 4);
  const key = personality ^ originalTrainerId;
  const decrypted = new DataView(new ArrayBuffer(48));
  for (let offset = 0; offset < 48; offset += 4) {
    decrypted.setUint32(offset, (memory.u32(address + 32 + offset) ^ key) >>> 0, true);
  }
  let checksum = 0;
  for (let offset = 0; offset < 48; offset += 2) checksum = (checksum + decrypted.getUint16(offset, true)) & 0xFFFF;
  if (checksum !== memory.u16(address + 28)) {
    throw new Error(`Pokemon checksum failed at ${JSON.stringify(location)}.`);
  }
  const order = ORDERS[personality % 24];
  const growth = order[0] * 12;
  const attacks = order[1] * 12;
  const ev = order[2] * 12;
  const misc = order[3] * 12;
  const speciesId = decrypted.getUint16(growth, true);
  if (speciesId === 0) return null;
  const species = data.species(speciesId);
  const flagsRaw = memory.u8(address + 19);
  const experience = decrypted.getUint32(growth + 4, true);
  const level = isBox ? data.level(speciesId, experience) : memory.u8(address + 84);
  if (level < 1 || level > 100) throw new Error(`Invalid Pokemon level ${level}.`);
  const storedId = decrypted.getUint8(growth + 10) & 31;
  const nature = data.nature(storedId === 26 ? personality % 25 : storedId);
  const ivWord = decrypted.getUint32(misc + 4, true);
  const ivs: Stats = {
    hp: (ivWord >>> 1) & 31, attack: (ivWord >>> 6) & 31, defense: (ivWord >>> 11) & 31,
    speed: (ivWord >>> 16) & 31, specialAttack: (ivWord >>> 21) & 31, specialDefense: (ivWord >>> 26) & 31,
  };
  const evs: Stats = {
    hp: decrypted.getUint8(ev), attack: decrypted.getUint8(ev + 1), defense: decrypted.getUint8(ev + 2),
    speed: decrypted.getUint8(ev + 3), specialAttack: decrypted.getUint8(ev + 4), specialDefense: decrypted.getUint8(ev + 5),
  };
  const abilitySlot = (decrypted.getUint32(misc + 8, true) >>> 29) & 3;
  const ppBonuses = decrypted.getUint8(growth + 8);
  const moves = Array.from({ length: 4 }, (_, slot) => {
    const id = decrypted.getUint16(attacks + slot * 2, true);
    const move = data.move(id);
    const pp = decrypted.getUint8(attacks + 8 + slot);
    const ppUps = (ppBonuses >>> (slot * 2)) & 3;
    const basePp = move ? data.basePp(id) : 0;
    const maxPp = location.kind === 'opponent-party' ? null : basePp + Math.floor(basePp * ppUps / 5);
    if (maxPp !== null && pp > maxPp) throw new Error(`Invalid PP at ${JSON.stringify(location)}, move slot ${slot}.`);
    return { slot, move, pp, maxPp, ppUps };
  });
  const stats: Stats = isBox ? data.stats(species, level, ivs, evs, nature.id) : {
    hp: memory.u16(address + 88), attack: memory.u16(address + 90), defense: memory.u16(address + 92),
    speed: memory.u16(address + 94), specialAttack: memory.u16(address + 96), specialDefense: memory.u16(address + 98),
  };
  const hp = isBox ? stats.hp : memory.u16(address + 86);
  if (hp > stats.hp) throw new Error('Pokemon current HP exceeds maximum HP.');
  return {
    id: `${location.kind}:${isBox ? `${location.box}:` : ''}${location.slot}`,
    identity: { personality, originalTrainerId }, location, species,
    nickname: decodeGBAString(memory.bytes(address + 8, 10), 10),
    originalTrainerName: decodeGBAString(memory.bytes(address + 20, 7), 7),
    language: memory.u8(address + 18), flagsRaw, isEgg: !!(flagsRaw & 4), isBadEgg: !!(flagsRaw & 1),
    heldItem: data.item(decrypted.getUint16(growth + 2, true)), experience, level,
    friendship: decrypted.getUint8(growth + 9), nature: { ...nature, storedId },
    ability: { ...data.speciesAbility(speciesId, abilitySlot), slot: abilitySlot }, ivs, evs, moves,
    condition: {
      source: isBox ? 'box-withdrawal-derivation' : 'party-memory', hp, stats,
      majorStatusRaw: isBox ? 0 : memory.u32(address + 80),
    },
    rawRecord: Array.from(raw),
  };
}
