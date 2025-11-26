/* eslint-disable max-len */

import {
  Field
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { calculateAllMoves, megaEvolve, toMoveResult } from './moveScoring';
import { OpposingTrainer } from '../trainer-sets';
import { getBox } from './playthrough/museum.collection';
import { gen } from '../configuration';

const RunAndBun = 8;
inGen(RunAndBun, ({ }) => {
  describe('Move Scoring', () => {
    describe('Mega evolution', () => {
      test(`Mega evolve`, () => {
        let [Lopunny] = importTeam(`
Lopunny @ Lopunnite
Level: 1
- Fake out
- Hyper Beam
`);
        let mega = megaEvolve(Lopunny);
        expect(mega.name).toBe('Lopunny-Mega');
        expect(mega.ability).toBe('Scrappy');
        expect(mega.stats.atk).toBeGreaterThan(Lopunny.stats.atk);
        expect(mega.moves).toEqual(Lopunny.moves);
      });
    });
  });
});