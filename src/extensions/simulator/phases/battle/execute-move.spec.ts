/* eslint-disable max-len */
import {
  Field,
  Generations,
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { calculateMoveResult } from '../../moveScoring';
import { executeMove } from './execute-move';
import { cpuRng, playerRng } from '../../../configuration';
import { getBox } from '../../playthrough/museum.collection';
import { OpposingTrainer } from '../../../trainer-sets';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('executeMove', () => {
    describe(`Berries`, () => {
      it('Salac Berry', () => {
        const [, Croagunk,] = OpposingTrainer('Team Aqua Grunt Petalburg Woods');
        const { Starly } = getBox();

        let result = executeMove(Starly, Croagunk, 'Aerial Ace', new Field(), playerRng);
        expect(result.defender.item).toBeUndefined();
        expect(result.defender.boosts.spe).toBe(1);
      });
    });

    describe(`Defender abilities`, () => {
      it ('Cotton Down', () => {
        const { Gossifleur } = getBox();
        const [_, Clobbopus ] = OpposingTrainer('Triathlete Mikey');
        let executionResult = executeMove(Clobbopus, Gossifleur, 'Rock Smash', new Field(), cpuRng);
        expect(executionResult.attacker.boosts.spe).toBe(-1);
      });
    });

    describe('Move effects', () => {
      it('Rock smash', () => {
        const { Gossifleur } = getBox();
        const [_, Clobbopus ] = OpposingTrainer('Triathlete Mikey');
        let executionResult = executeMove(Clobbopus, Gossifleur, 'Rock Smash', new Field(), cpuRng);
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

      let executionResult = executeMove(Urshifu, Dragapult, 'Sucker Punch', new Field(), playerRng);
      expect(executionResult.attacker.curHP()).toBeLessThan(Urshifu.maxHP());
      expect(executionResult.defender.curHP()).toBe(0);
    });
  });
});