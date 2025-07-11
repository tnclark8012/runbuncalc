/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {AbilityName, Weather} from '../data/interface';
import { Field } from '../field';
import { BattleSimulator, TurnOutcome } from '../simulator';
import { Generations } from './gen';
import {inGen, inGens, tests} from './helper';
import { Pokemon } from '..';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('Custom tests for calculator', () => {
    describe('Move selection', () => {
      test(`Slower CPU wins with a priority move`, () => {
        let cpu = Pokemon('Lopunny', { 
          moves: ['Fake Out', 'Hyper Beam'],
          level: 1
        });
        let player = Pokemon('Aerodactyl', {
          moves: ['Stone Edge'],
          level: 100,
          curHP: 1
        });
        let battleSimulator = new BattleSimulator(new Generations(Dex).get(gen), player, cpu, new Field(), new Field());
        const result = battleSimulator.getResult();
        expect(result.winner.name).toEqual('Lopunny');
      });

      test(`CPU thinks it lives with focus sash, so doesn't go for priority. Player sees focus sash and goes for multi-hit`, () => {
          let cpuKrabby = Pokemon('Krabby', { 
            moves: ['Aqua Jet', 'Crabhammer'],
            level: 1,
            item: 'Focus Sash'
          });
          let playerAerodactyl = Pokemon('Aerodactyl', {
            moves: ['Dual Wingbeat', 'Stone Edge'],
            level: 10,
            curHP: 1
          });
          let battleSimulator = new BattleSimulator(new Generations(Dex).get(gen), playerAerodactyl, cpuKrabby, new Field(), new Field());
          const result = battleSimulator.getResult();
          expect(result.winner.name).toEqual('Aerodactyl');
          expect(result.turnOutcomes.length).toBe(1);
          expectTurn(
            result.turnOutcomes[0], 
            { pokemon: playerAerodactyl, move: 'Dual Wingbeat' }
          )
          expect(result.turnOutcomes[0].battleState.cpuPokemon.item).toBeUndefined();
      });
    });

    describe('Turn sequence', () => {
      test('stat changes from moves', () => {
         let cpuKrabby = Pokemon('Krabby', { 
            moves: ['Swords Dance'],
            level: 100
          });
          let playerInfernape = Pokemon('Infernape', {
            moves: ['Close Combat'],
            level: 5
          });
          let battleSimulator = new BattleSimulator(new Generations(Dex).get(gen), playerInfernape, cpuKrabby, new Field(), new Field());
          const result = battleSimulator.getResult();
          expect(result.turnOutcomes.length).toBe(1);
          expectTurn(
            result.turnOutcomes[0], 
            { pokemon: cpuKrabby, move: 'Swords Dance' },
            { pokemon: playerInfernape, move: 'Close Combat' },
          )
          expect(result.turnOutcomes[0].battleState.cpuPokemon.boosts.atk).toBe(2);
          expect(result.turnOutcomes[0].battleState.playerPokemon.boosts.def).toBe(-1);
          expect(result.turnOutcomes[0].battleState.playerPokemon.boosts.spd).toBe(-1);
      })
    })
  });

  function expectTurn(turn: TurnOutcome, firstMover: { pokemon: Pokemon, move: string }, secondMover?: { pokemon: Pokemon, move: string }) {
    let first = turn.actions[0];
    let second = turn.actions[1];
    expect(`1. ${first.attacker.name} - ${first.move.name}`).toBe(`1. ${firstMover.pokemon.name} - ${firstMover.move}`);
    if (secondMover) {
      expect(`2. ${second.attacker.name} - ${second.move.name}`).toBe(`2. ${secondMover.pokemon.name} - ${secondMover.move}`);
    }
    else {
      expect(turn.actions[1]).toBeUndefined()
    }
  }
});