import type { SetCollection } from './storage.contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeKey(key: string): boolean {
  return !['__proto__', 'constructor', 'prototype'].includes(key);
}

function assertSetCollection(collection: unknown): asserts collection is SetCollection {
  if (!isRecord(collection) || Object.keys(collection).length === 0) {
    throw new Error('Expected a nonempty collection of boxes.');
  }
  for (const [name, data] of Object.entries(collection)) {
    if (!safeKey(name) || !isRecord(data) || !isRecord(data.customSets) || !Array.isArray(data.party)) {
      throw new Error(`Invalid box collection: ${name}.`);
    }
    const pokemonIds = new Set<string>();
    for (const [species, sets] of Object.entries(data.customSets)) {
      if (!safeKey(species) || !isRecord(sets)) throw new Error(`Invalid sets for ${species}.`);
      for (const [setName, set] of Object.entries(sets)) {
        if (!safeKey(setName) || !isRecord(set)) throw new Error(`Invalid set for ${species}.`);
        for (const field of ['ability', 'item', 'nature', 'teraType']) {
          if (set[field] !== undefined && typeof set[field] !== 'string') throw new Error(`Invalid ${field} for ${species}.`);
        }
        if (set.isCustomSet !== undefined && typeof set.isCustomSet !== 'boolean') {
          throw new Error(`Invalid custom-set flag for ${species}.`);
        }
        if (set.level !== undefined && (typeof set.level !== 'number' || !Number.isInteger(set.level) || set.level < 1 || set.level > 100)) {
          throw new Error(`Invalid level for ${species}.`);
        }
        if (set.moves !== undefined && (!Array.isArray(set.moves) || set.moves.length > 4 || set.moves.some(move => typeof move !== 'string'))) {
          throw new Error(`Invalid moves for ${species}.`);
        }
        for (const field of ['ivs', 'evs']) {
          const stats = set[field];
          if (stats === undefined) continue;
          if (!isRecord(stats) || Object.entries(stats).some(([stat, value]) =>
            !['hp', 'at', 'df', 'sp', 'sa', 'sd'].includes(stat) ||
            typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > (field === 'ivs' ? 31 : 255))) {
            throw new Error(`Invalid ${field} for ${species}.`);
          }
        }
        pokemonIds.add(`${species} (${setName})`);
      }
    }
    if (data.party.some(id => typeof id !== 'string' || !pokemonIds.has(id))) {
      throw new Error(`Party references a missing Pokemon in ${name}.`);
    }
  }
}

export function parseSetCollectionJson(text: string): SetCollection {
  const collection: unknown = JSON.parse(text);
  assertSetCollection(collection);
  return collection;
}
