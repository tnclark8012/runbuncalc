/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {AbilityName, Weather} from '../data/interface';
import { Field } from '../field';
import { BattleSimulator } from '../matchup';
import { Generations } from './gen';
import {inGen, inGens, tests} from './helper';

describe('Custom tests for calculator', () => {
  describe('Move selection', () => {
    inGen(8, ({gen, calculate, Pokemon, Move}) => {
      test(`CPU wins with a priority move`, () => {
        let cpu = Pokemon('Lopunny', { 
          moves: ['Fake Out'],
          level: 1
        });
        let player = Pokemon('Aerodactyl', {
          moves: ['Stone Edge'],
          level: 100,
          curHP: 1
        });
        let battleSimulator = new BattleSimulator(new Generations(Dex).get(gen), player, cpu, new Field(), new Field());
        expect(battleSimulator.getResult().turnOutcomes[0].actions[0]).toEqual([]);
        expect(battleSimulator.getResult().winner.name).toBe(cpu.name);

      });
    });
  });
});