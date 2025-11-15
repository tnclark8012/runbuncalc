/* eslint-disable max-len */
import {
  Generations,
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { calculateMoveResult } from '../../moveScoring';
import { executeMove } from './execute-move';
import { cpuRng, playerRng } from '../../../configuration';
import { getBox } from '../../playthrough/museum.collection';
import { Trainers } from '../../../trainer-sets';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('executeMove', () => {
    xtest(`Berries`, () => {
        
    });

    describe(`Defender abilities`, () => {
      it ('Cotton Down', () => {
        const { Gossifleur } = getBox();
        const [_, Clobbopus ] = Trainers['Triathlete Mikey'];
        let moveResult = calculateMoveResult(Clobbopus, Gossifleur, 'Rock Smash');
        let executionResult = executeMove(Generations.get(gen), Clobbopus, Gossifleur, moveResult, cpuRng);
        expect(executionResult.attacker.boosts.spe).toBe(-1);
      });
    });

    describe('Move effects', () => {
      it('Rock smash', () => {
        const { Gossifleur } = getBox();
        const [_, Clobbopus ] = Trainers['Triathlete Mikey'];
        let moveResult = calculateMoveResult(Clobbopus, Gossifleur, 'Rock Smash');
        let executionResult = executeMove(Generations.get(gen), Clobbopus, Gossifleur, moveResult, cpuRng);
        expect(executionResult.defender.boosts.def).toBe(-1);
      })
    })

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