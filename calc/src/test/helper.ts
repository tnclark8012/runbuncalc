/* eslint-env jest */

import * as I from '../data/interface';
import {calculate, Pokemon, Move, Result, SPECIES, ITEMS, ABILITIES, PokemonOptions} from '../index';
import {State} from '../state';
import {Field, Side} from '../field';
import { SpeciesData } from '../data/species';
import { isNativeError } from 'util/types';
import { notImplemented } from '../notImplementedError';
import { formatWithOptions } from 'util';

const calc = (gen: I.GenerationNum) => (
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  field?: Field
) => calculate(gen, attacker, defender, move, field);

const move = (gen: I.GenerationNum) => (
  name: string,
  options: Partial<Omit<State.Move, 'ability' | 'item' | 'species'>> & {
    ability?: string;
    item?: string;
    species?: string;
  } = {}
) => new Move(gen, name, options as any);

const pokemon = (gen: I.GenerationNum) => (
  name: string,
  options: Partial<Omit<State.Pokemon, 'ability' | 'item' | 'nature' | 'moves'>> & {
    ability?: string;
    item?: string;
    nature?: string;
    moves?: string[];
    curHP?: number;
    ivs?: Partial<I.StatsTable> & {spc?: number};
    evs?: Partial<I.StatsTable> & {spc?: number};
    boosts?: Partial<I.StatsTable> & {spc?: number};
  } = {}
) => new Pokemon(gen, name, options as any);

const field = (field: Partial<State.Field> = {}) => new Field(field);

const side = (side: State.Side = {}) => new Side(side);

interface Gen {
  gen: I.GenerationNum;
  calculate: ReturnType<typeof calc>;
  Pokemon: ReturnType<typeof pokemon>;
  Move: ReturnType<typeof move>;
  Field: typeof field;
  Side: typeof side;
}

export function inGen(gen: I.GenerationNum, fn: (gen: Gen) => void) {
  fn({
    gen,
    calculate: calc(gen),
    Move: move(gen),
    Pokemon: pokemon(gen),
    Field: field,
    Side: side,
  });
}

export function inGens(from: I.GenerationNum, to: I.GenerationNum, fn: (gen: Gen) => void) {
  for (let gen = from; gen <= to; gen++) {
    inGen(gen, fn);
  }
}

export function tests(name: string, fn: (gen: Gen) => void, type?: 'skip' | 'only'): void;
export function tests(
  name: string,
  from: I.GenerationNum,
  fn: (gen: Gen) => void,
  type?: 'skip' | 'only'
): void;
export function tests(
  name: string,
  from: I.GenerationNum,
  to: I.GenerationNum,
  fn: (gen: Gen) => void,
  type?: 'skip' | 'only'
): void;
export function tests(...args: any[]) {
  const name = args[0];
  let from: I.GenerationNum;
  let to: I.GenerationNum;
  let fn: (gen: Gen) => void;
  let type: 'skip' | 'only' | undefined = undefined;
  if (typeof args[1] !== 'number') {
    from = 1;
    to = 8;
    fn = args[1];
    type = args[2];
  } else if (typeof args[2] !== 'number') {
    from = args[1] as I.GenerationNum ?? 1;
    to = 8;
    fn = args[2];
    type = args[3];
  } else {
    from = args[1] as I.GenerationNum ?? 1;
    to = args[2] as I.GenerationNum ?? 8;
    fn = args[3];
    type = args[4];
  }

  inGens(from, to, gen => {
    const n = `${name} (gen ${gen.gen})`;
    if (type === 'skip') {
      test.skip(n, () => fn!(gen));
    } else if (type === 'only') {
      test.only(n, () => fn!(gen));
    } else {
      test(n, () => fn!(gen));
    }
  });
}

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toMatch(gen: I.GenerationNum, notation?: '%' | 'px' | ResultDiff, diff?: ResultDiff): R;
    }
  }
}

type ResultDiff = Partial<Record<I.GenerationNum, Partial<ResultBreakdown>>>;
interface ResultBreakdown {
  range: [number, number];
  desc: string;
  result: string;
}

expect.extend({
  toMatch(
    received: Result,
    gen: I.GenerationNum,
    notation?: '%' | 'px' | ResultDiff,
    diff?: ResultDiff
  ) {
    if (typeof notation !== 'string') {
      diff = notation;
      notation = '%';
    }
    if (!diff) throw new Error('toMatch called with no diff!');

    const breakdowns = Object.entries(diff).sort() as [string, ResultBreakdown][];
    const expected = {range: undefined! as [number, number], desc: '', result: ''};
    for (const [g, {range, desc, result}] of breakdowns) {
      if (Number(g) > gen) break;
      if (range) expected.range = range;
      if (desc) expected.desc = desc;
      if (result) expected.result = result;
    }

    if (!(expected.range || expected.desc || expected.result)) {
      throw new Error(`toMatch called with empty diff: ${diff}`);
    }

    if (expected.range) {
      if (this.isNot) {
        expect(received.range()).not.toEqual(expected.range);
      } else {
        expect(received.range()).toEqual(expected.range);
      }
    }
    if (expected.desc) {
      const r = received.fullDesc(notation).split(': ')[0];
      if (this.isNot) {
        expect(r).not.toEqual(expected.desc);
      } else {
        expect(r).toEqual(expected.desc);
      }
    }
    if (expected.result) {
      const post = received.fullDesc(notation).split(': ')[1];
      const r = `(${post.split('(')[1]}`;
      if (this.isNot) {
        expect(r).not.toEqual(expected.result);
      } else {
        expect(r).toEqual(expected.result);
      }
    }

    return {pass: !this.isNot, message: () => ''};
  },
});

const statToLegacyMap: { [stat: string]: string } = {
  'hp': 'hp',
  'atk': 'at',
  'def': 'df',
  'spa': 'sa',
  'spd': 'sd',
  'spe': 'sp'
};

export function importPokemon(importText: string): Pokemon {
  return importTeam(importText)[0];
}

export function importTeam(importText: string): Pokemon[] {
	var rows = importText.trim().split("\n");
  rows = rows.map(r => r.trim());
	var currentRow;
	let currentPoke: Pokemon;
	var addedpokes = 0;
	var pokelist = []
	for (var i = 0; i < rows.length; i++) {
		currentRow = rows[i].split(/[()@]/);
		for (var j = 0; j < currentRow.length; j++) {
			currentRow[j] = checkExeptions(currentRow[j].trim());
			if (SPECIES[9][currentRow[j].trim()] !== undefined) {
				let speciesData: SpeciesData = SPECIES[9][currentRow[j].trim()];
				let stats = getStats(rows, i + 1);
        let moves = getMoves(rows, i);
        currentPoke = new Pokemon(9, currentRow[j].trim(), {
          item: getItem(currentRow, j + 1),
          name: currentRow[j].trim() as any,
          ability: getAbility(rows[i + 1].split(":")),
          moves: moves,
          ...stats,
        });
				pokelist.push(currentPoke);
				break;
			}
		}
	}

  return pokelist;
  
  function getAbility(row: string[]): string | undefined {
    var ability = row[1] ? row[1].trim() : '';
    if (ABILITIES[9].indexOf(ability) !== -1) return ability;
    return;
  }

  function getStats(rows: string[], offset: number): PokemonOptions {
    let currentPoke: PokemonOptions = {};
    currentPoke.nature = "Serious";
    var currentEV: [string, string];
    var currentIV: string[];
    var currentAbility;
    var currentTeraType;
    var currentNature;
    currentPoke.level = 100;
    for (var x = offset; x < offset + 9; x++) {
      if (!rows[x] || !rows[x].length)
        return currentPoke;
      
      var currentRow = rows[x] ? rows[x].split(/[/:]/) : '';
      var evs: Partial<I.StatsTable> = {};
      var ivs: Partial<I.StatsTable> = {};
      var ev;
      var j;

      switch (currentRow[0]) {
      case 'Level':
        currentPoke.level = parseInt(currentRow[1].trim());
        continue;
      case 'EVs':
        for (j = 1; j < currentRow.length; j++) {
          currentEV = currentRow[j].trim().split(" ") as any;
          currentEV[1] = statToLegacyStat(currentEV[1].toLowerCase());
          (evs as any)[currentEV[1] as any] = parseInt(currentEV[0]);
        }
        currentPoke.evs = evs;
        continue;
      case 'IVs':
        for (j = 1; j < currentRow.length; j++) {
          currentIV = currentRow[j].trim().split(" ");
          currentIV[1] = currentIV[1].toLowerCase();//statToLegacyStat(currentIV[1].toLowerCase());
          (ivs as any)[currentIV[1]] = parseInt(currentIV[0]);
        }
        currentPoke.ivs = ivs;
        continue;
      }
      currentAbility = rows[x] ? rows[x].trim().split(":") : '';
      if (currentAbility[0] == "Ability") {
        currentPoke.ability = currentAbility[1].trim();
      }

      currentNature = rows[x] ? rows[x].trim().split(" ") : '';
      if (currentNature[1] == "Nature") {
        currentPoke.nature = currentNature[0];
      }
    }
    return currentPoke;
  }

  function statToLegacyStat(stat: string): string {
    return statToLegacyMap[stat];
  }

  function legacyStatToStat(legacyStat: string): string {
    for (let stat in statToLegacyMap) {
      if (statToLegacyMap[stat] === legacyStat)
        return stat;
    }

    notImplemented();
  }

  function checkExeptions(poke: string) {
    switch (poke) {
      case 'Aegislash':
        poke = "Aegislash-Blade";
        break;
      case 'Basculin-Blue-Striped':
        poke = "Basculin";
        break;
      case 'Gastrodon-East':
        poke = "Gastrodon";
        break;
      case 'Mimikyu-Busted-Totem':
        poke = "Mimikyu-Totem";
        break;
      case 'Mimikyu-Busted':
        poke = "Mimikyu";
        break;
      case 'Pikachu-Belle':
      case 'Pikachu-Cosplay':
      case 'Pikachu-Libre':
      case 'Pikachu-Original':
      case 'Pikachu-Partner':
      case 'Pikachu-PhD':
      case 'Pikachu-Pop-Star':
      case 'Pikachu-Rock-Star':
        poke = "Pikachu";
        break;
      case 'Vivillon-Fancy':
      case 'Vivillon-Pokeball':
        poke = "Vivillon";
        break;
      case 'Florges-White':
      case 'Florges-Blue':
      case 'Florges-Orange':
      case 'Florges-Yellow':
        poke = "Florges";
        break;
    }
    return poke;
  }

  function getItem(currentRow: string[], j: number) {
    for (;j < currentRow.length; j++) {
      var item = currentRow[j].trim();
      if (ITEMS[9].indexOf(item) != -1) {
        return item;
      }
    }

    return;
  }

  function getMoves(rows: string[], offset: number): string[] {
    var movesFound = false;
    var moves = [];
    for (var x = offset; x < offset + 12; x++) {
      if (rows[x]) {
        if (rows[x][0] == "-") {
          movesFound = true;
          var move = rows[x].substr(2, rows[x].length - 2).replace("[", "").replace("]", "").replace("  ", "");
          moves.push(move);
        } else {
          if (movesFound == true) {
            break;
          }
        }
      }
    }
    return moves;
  }
}