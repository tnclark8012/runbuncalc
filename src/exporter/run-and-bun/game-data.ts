import { ITEMS, MOVES, NATURES, SPECIES } from './data';
import { ABILITY_NAMES, EXPERIENCE, ITEM_POCKETS, MOVE_PP, SPECIES_INFO } from './tables';
import type { NamedId, Stats } from './types';

export class RunAndBunData {
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
    return this.named(ABILITY_NAMES, id, 0, 'ability');
  }

  speciesAbility(species: number, slot: number): NamedId {
    if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new Error(`Invalid ability slot ${slot}.`);
    this.species(species);
    const info = SPECIES_INFO[species];
    return this.ability(info[7 + slot] || info[7]);
  }

  itemPocket(id: number): number {
    this.item(id);
    return ITEM_POCKETS[id];
  }

  basePp(id: number): number {
    this.move(id);
    return MOVE_PP[id];
  }

  level(species: number, experience: number): number {
    this.species(species);
    const growth = SPECIES_INFO[species][6];
    if (growth > 5) throw new Error(`Invalid growth group ${growth}.`);
    let level = 1;
    while (level < 100 && experience >= EXPERIENCE[growth][level + 1]) level++;
    return level;
  }

  stats(species: NamedId, level: number, ivs: Stats, evs: Stats, nature: number): Stats {
    this.species(species.id);
    const keys: (keyof Stats)[] = ['hp', 'attack', 'defense', 'speed', 'specialAttack', 'specialDefense'];
    const result: Stats = { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 };
    keys.forEach((key, index) => {
      const base = SPECIES_INFO[species.id][index];
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
