/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {
  I,
  A,
  Field,
  Generations,
  Pokemon
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { calculateAllMoves, getHighestDamagingMovePercentChances, megaEvolve, toMoveResult } from './moveScoring';
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

  describe('getHighestDamagingMovePercentChances', () => {
    it('sanity check', () => {
      let { Starly } = getBox();
      let Carvanha = importPokemon(`
      Carvanha @ Oran Berry
Level: 11
Naive Nature
Ability: Rough Skin
- Bite
- Water Pulse
`);
      let cpuMoveResults = calculateAllMoves(gen, Carvanha, Starly, new Field()).map(toMoveResult);
      const highestDamagingMovePercentChances = getHighestDamagingMovePercentChances([
        { move: { name: 'Bite' }, damageRolls: [10, 20] },
        { move: { name: 'Water Pulse' }, damageRolls: [20, 30] }
      ]);
      const expectedPcts = {
        'Bite': 0.25,
        'Water Pulse': 1, // No matter what bite rolls, Water Pulse should always consider itself the highest damage
      };
      const actual: any = {};
      for (let i = 0; i < cpuMoveResults.length; i++) {
        let moveResult = cpuMoveResults[i];
        actual[moveResult.move.name] = highestDamagingMovePercentChances[i];
      }
      expect(actual).toEqual(expectedPcts);
    });

    it('Consider all moves', () => {
      let { Starly } = getBox();
      let [Carvanha] = OpposingTrainer('Team Aqua Grunt Petalburg Woods');
      let cpuMoveResults = calculateAllMoves(gen, Carvanha, Starly, new Field()).map(toMoveResult);
      const highestDamagingMovePercentChances = getHighestDamagingMovePercentChances(cpuMoveResults);
      const expectedPcts = {
        "Aqua Jet": 0,
        "Bite": 0.89453125,
        "Poison Fang": 0,
        "Water Pulse": 0.3515625,
      };
      const actual: any = {};
      for (let i = 0; i < cpuMoveResults.length; i++) {
        let moveResult = cpuMoveResults[i];
        actual[moveResult.move.name] = highestDamagingMovePercentChances[i];
      }
      expect(actual).toEqual(expectedPcts);
    });
  });
});