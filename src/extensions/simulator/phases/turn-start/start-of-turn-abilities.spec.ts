/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon, expectPlayerTeam, expectCpuTeam } from '../../test-helper';
import { ActivePokemon, BattleFieldState } from '../../moveScoring.contracts';
import { applyStartOfTurnAbilities } from './start-of-turn-abilities';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('Start of turn abilities', () => {
    it('Intimidate - first turn out', () => {
      let [Golurk, Flapple] = importTeam(`
Golurk @ Lum Berry
Level: 45
Jolly Nature
Ability: Iron Fist
- Earthquake
- Shadow Punch
- Hammer Arm
- Stealth Rock

Flapple @ Starf Berry
Level: 45
Hasty Nature
Ability: Gluttony
- Dragon Pulse
- Grav Apple
- Acrobatics
- Dragon Dance
`);
      let [Gyarados, Armaldo] = importTeam(`
Gyarados
Level: 91
Serious Nature
Ability: Intimidate
IVs: 24 HP / 24 Atk / 24 Def / 16 SpA / 29 SpD / 23 Spe
- Waterfall
- Ice Fang
- Crunch
- Scale Shot

Armaldo
Level: 91
Hardy Nature
Ability: Battle Armor
IVs: 24 HP / 10 Atk / 21 Def / 16 SpA / 28 SpD / 18 Spe
- Rapid Spin
- Leech Life
- Rock Blast
- Stone Edge
`);

      Gyarados = Gyarados.clone({ abilityOn: true });
      let state = new BattleFieldState(
        'doubles',
        [{ pokemon: Gyarados, firstTurnOut: true }, { pokemon: Armaldo, firstTurnOut: true }],
        [{ pokemon: Golurk, firstTurnOut: true }, { pokemon: Flapple, firstTurnOut: true }],
        [],
        [],
        new Field(),
        new Field(),
      );
      const newState = applyStartOfTurnAbilities(state);

      let GyaradosAfter = Gyarados.clone({ abilityOn: false });
      let GolurkAfter = Golurk.clone({ boosts: { atk: -1 } });
      let FlappleAfter = Flapple.clone({ boosts: { atk: -1 } });
      expectPlayerTeam([{ pokemon: GyaradosAfter, firstTurnOut: true }, { pokemon: Armaldo, firstTurnOut: true }], [], newState);
      expectCpuTeam([{ pokemon: GolurkAfter, firstTurnOut: true }, { pokemon: FlappleAfter, firstTurnOut: true }], [], newState);
    });
  });
});