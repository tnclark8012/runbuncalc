import { A, I, Field } from '@smogon/calc';

declare global {
  var gen: I.Generation;
  var cntrlIsPressed: boolean;
  /**
   * dist\js\shared_controls.js
   */
  function createPokemon(pokeInfo: JQuery<HTMLElement> | string | null): A.Pokemon;
  function createField(): Field;
  function checkStatBoost(p1: A.Pokemon, p2: A.Pokemon): void;
  
  interface DamageRange {
			move: A.Move,
			lowestRoll: number,
			highestRoll: number,
  }

  function getDamageRanges(results: A.Result[]): DamageRange[];

  function updateDex(customSets: any): void;
  function selectFirstMon(): void;
}