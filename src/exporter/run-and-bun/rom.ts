import { decodeGBAString } from '../charmap';
import { ITEMS, MOVES, NATURES, SPECIES } from './data';
import type { NamedId, Stats } from './types';

export class RunAndBunRom {
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    if (bytes.length < 0x678D60 + (ITEMS.length + 1) * 44) {
      throw new Error('ROM is truncated or does not contain the researched Run & Bun tables.');
    }
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (this.ability(1).name !== 'Stench' || this.ability(22).name !== 'Intimidate') {
      throw new Error('ROM ability names do not match the researched Run & Bun layout.');
    }
  }

  private named(table: readonly string[], id: number, offset: number, kind: string): NamedId {
    const name = table[id - offset];
    if (!Number.isInteger(id) || id < offset || name === undefined) {
      throw new Error(`Unknown Run & Bun ${kind} ID ${id}.`);
    }
    return { id, name };
  }

  species(id: number): NamedId { return this.named(SPECIES, id, 1, 'species'); }
  item(id: number): NamedId | null { return id === 0 ? null : this.named(ITEMS, id, 1, 'item'); }
  move(id: number): NamedId | null { return id === 0 ? null : this.named(MOVES, id, 0, 'move'); }
  nature(id: number): NamedId { return this.named(NATURES, id, 0, 'nature'); }

  ability(id: number): NamedId {
    if (!Number.isInteger(id) || id < 0 || id > 267) throw new Error(`Unknown Run & Bun ability ID ${id}.`);
    if (id === 0) return { id, name: 'None' };
    const offset = 0x3AC0C9 + id * 17;
    const name = decodeGBAString(new Uint8Array(this.view.buffer, this.view.byteOffset + offset, 17), 17);
    if (!name || name.includes('?')) throw new Error(`Invalid ROM ability name for ID ${id}.`);
    return { id, name };
  }

  speciesAbility(species: number, slot: number): NamedId {
    if (slot > 2) throw new Error(`Invalid ability slot ${slot}.`);
    const base = 0x3B7CE0 + species * 36 + 24;
    return this.ability(this.view.getUint16(base + slot * 2, true) || this.view.getUint16(base, true));
  }

  itemPocket(id: number): number { return this.view.getUint8(0x678D60 + id * 44 + 26); }
  basePp(id: number): number { return this.view.getUint8(0x3B0C5C + id * 20 + 6); }

  level(species: number, experience: number): number {
    const growth = this.view.getUint8(0x3B7CE0 + species * 36 + 21);
    if (growth > 5) throw new Error(`Invalid growth group ${growth}.`);
    const base = 0x3B7040 + growth * 404;
    let level = 1;
    while (level < 100 && experience >= this.view.getUint32(base + (level + 1) * 4, true)) level++;
    return level;
  }

  stats(species: NamedId, level: number, ivs: Stats, evs: Stats, nature: number): Stats {
    const keys: (keyof Stats)[] = ['hp', 'attack', 'defense', 'speed', 'specialAttack', 'specialDefense'];
    const result: Stats = { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 };
    keys.forEach((key, index) => {
      const base = this.view.getUint8(0x3B7CE0 + species.id * 36 + index);
      let stat = Math.floor((2 * base + ivs[key] + Math.floor(evs[key] / 4)) * level / 100);
      if (index === 0) {
        stat = species.name === 'Shedinja' ? 1 : stat + level + 10;
      } else {
        stat += 5;
        const increased = Math.floor(nature / 5) + 1;
        const decreased = nature % 5 + 1;
        if (increased !== decreased) {
          if (index === increased) stat = Math.floor(stat * 110 / 100);
          if (index === decreased) stat = Math.floor(stat * 90 / 100);
        }
      }
      result[key] = stat;
    });
    return result;
  }
}
