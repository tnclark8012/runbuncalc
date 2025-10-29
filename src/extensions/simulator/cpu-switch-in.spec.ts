/* eslint-disable max-len */

import {
  Field,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { BattleFieldState } from './moveScoring.contracts';
import { calculateCpuSwitchIn } from './cpu-switch-in';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('CPU Switch In', () => {
    it('Prefer fast OHKO', () => {
      let cpuParty = importTeam(``);
      let playerMon = importPokemon(``);
      let state = new BattleFieldState(
        'singles',
        [{pokemon: playerMon}],
        [],
        [],
        cpuParty,
        new Field(),
        new Field(),
      );
      const switchIn = calculateCpuSwitchIn(cpuParty, playerMon, state);
      expect(switchIn.id).toBe('mewtwo');
    });

    xit(`Doesn't see player priority KOs`, () => {
    });
  });
});