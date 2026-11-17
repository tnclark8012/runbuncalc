import { Generations, toID } from '@smogon/calc';
import type { IVRecord, SetCollectionData } from '../../extensions/core/storage.contracts';
import type { GameStateSnapshot, SnapshotPokemon, Stats } from './types';

function legacyStats(stats: Stats): IVRecord {
  return { hp: stats.hp, at: stats.attack, df: stats.defense, sp: stats.speed, sa: stats.specialAttack, sd: stats.specialDefense };
}

function baseSetName(pokemon: SnapshotPokemon): string {
  return pokemon.nickname.trim() ? pokemon.nickname : pokemon.species.name;
}

export interface SnapshotBoxExport {
  collection: Record<string, SetCollectionData & { gameStateSnapshot: GameStateSnapshot }>;
  warnings: string[];
}

export function snapshotToBoxExport(snapshot: GameStateSnapshot, collectionName = 'Run & Bun snapshot'): SnapshotBoxExport {
  if (!collectionName.trim() || ['__proto__', 'constructor', 'prototype'].includes(collectionName)) {
    throw new Error('Please use a nonempty collection name other than a reserved object key.');
  }
  const result: SetCollectionData & { gameStateSnapshot: GameStateSnapshot } = {
    customSets: {}, party: [], gameStateSnapshot: snapshot,
  };
  const warnings: string[] = [];
  const ownedPokemon = [...snapshot.player.party, ...snapshot.player.boxes.flatMap(box => box.pokemon)];
  const originalNames = new Map<string, Set<string>>();
  for (const pokemon of ownedPokemon) {
    if (pokemon.isEgg || pokemon.isBadEgg) continue;
    const species = pokemon.species.name;
    const names = originalNames.get(species) ?? new Set<string>();
    names.add(baseSetName(pokemon));
    originalNames.set(species, names);
  }
  const addPokemon = (pokemon: SnapshotPokemon) => {
    if (pokemon.isEgg || pokemon.isBadEgg) {
      warnings.push(`Skipped ${pokemon.id} in calculator sets because it is an egg or bad egg; retained in snapshot.`);
      return;
    }
    const species = pokemon.species.name;
    const generation = Generations.get(8);
    if (!generation.species.get(toID(species))) throw new Error(`Calculator does not recognize species ${species}.`);
    const abilityName = pokemon.ability.id === 266 ? 'As One (Glastrier)'
      : pokemon.ability.id === 267 ? 'As One (Spectrier)' : pokemon.ability.name;
    const ability = generation.abilities.get(toID(abilityName));
    if (!ability) throw new Error(`Calculator does not recognize ability ${abilityName}.`);
    const item = pokemon.heldItem ? generation.items.get(toID(pokemon.heldItem.name)) : undefined;
    if (pokemon.heldItem && !item) throw new Error(`Calculator does not recognize item ${pokemon.heldItem.name}.`);
    const moves = pokemon.moves.map(slot => {
      if (!slot.move) return '';
      const move = generation.moves.get(toID(slot.move.name));
      if (!move) throw new Error(`Calculator does not recognize move ${slot.move.name}.`);
      return move.name;
    });
    const sets = result.customSets[species] ?? (result.customSets[species] = {});
    const baseName = baseSetName(pokemon);
    let setName = baseName;
    let suffix = 2;
    while (
      Object.prototype.hasOwnProperty.call(sets, setName) ||
      ['__proto__', 'constructor', 'prototype'].includes(setName) ||
      (setName !== baseName && originalNames.get(species)!.has(setName))
    ) {
      setName = `${baseName} ${suffix++}`;
    }
    if (!pokemon.nickname.trim()) {
      warnings.push(`Used species name for ${pokemon.id} because its nickname is blank.`);
    }
    if (['__proto__', 'constructor', 'prototype'].includes(baseName)) {
      warnings.push(`Used "${setName}" for ${pokemon.id} because its nickname is a reserved set name.`);
    }
    sets[setName] = {
      isCustomSet: true, ability: ability.name, item: item?.name ?? '',
      level: pokemon.level, nature: pokemon.nature.name, ivs: legacyStats(pokemon.ivs), evs: legacyStats(pokemon.evs),
      moves,
    };
    if (pokemon.location.kind === 'party') result.party.push(`${species} (${setName})`);
  };
  ownedPokemon.forEach(addPokemon);
  return { collection: { [collectionName]: result }, warnings };
}
