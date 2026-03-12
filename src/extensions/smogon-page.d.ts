import type { Field, Move, Pokemon, Result } from '@smogon/calc';

declare global {
  var cntrlIsPressed: boolean;
  var nextTrainerId: number;
  /**
   * dist\js\shared_controls.js
   */
  function createPokemon(pokeInfo: JQuery<HTMLElement> | string | null): Pokemon;
  function createField(): Field;
  function checkStatBoost(p1: Pokemon, p2: Pokemon): void;
  
  interface DamageRange {
			move: Move,
			lowestRoll: number,
			highestRoll: number,
  }

  function getDamageRanges(results: Result[]): DamageRange[];

  function updateDex(customSets: any): void;
  function selectFirstMon(): void;
}