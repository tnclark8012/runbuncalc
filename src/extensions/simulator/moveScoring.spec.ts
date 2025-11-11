/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {
  I,
  A,
  Field,
  Generations,
  Pokemon
} from '@smogon/calc';
import { inGen, importTeam } from './test-helper';
import { megaEvolve } from './moveScoring';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
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