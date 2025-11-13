/* eslint-disable max-len */
import {
  Generations,
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { calculateMoveResult } from '../../moveScoring';
import { executeMove } from './execute-move';
import { playerRng } from '../../../configuration';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('executeMove', () => {
    xtest(`Berries`, () => {
        
    });

    test('Life orb', () => {
      const [Urshifu, Dragapult] = importTeam(`
Urshifu @ Life Orb
Level: 91
Naive Nature
Ability: Unseen Fist
IVs: 21 SpA / 23 SpD
- Wicked Blow
- Sucker Punch
- Close Combat
- Iron Head

Dragapult @ Power Herb
Level: 89
Adamant Nature
Ability: Clear Body
- Dragon Darts
- Phantom Force
- Aqua Tail
- Infestation
      `);

      let moveResult = calculateMoveResult(Urshifu, Dragapult, 'Sucker Punch');
      let executionResult = executeMove(Generations.get(gen), Urshifu, Dragapult, moveResult, playerRng);
      expect(executionResult.attacker.curHP()).toBeLessThan(Urshifu.maxHP());
      expect(executionResult.defender.curHP()).toBe(0);
    });
  });
});