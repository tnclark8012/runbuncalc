/* eslint-disable max-len */

import {
  Field
} from '@smogon/calc';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../moveScoring.contracts';
import { expectCpuTeam, importTeam, inGen } from '../../test-helper';
import { applyCpuSwitchIns } from './cpu-switch-in';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('CPU Switch In', () => {
    it('Take first mon from party if none on the field', () => {
      let [cpu1, cpu2, cpu3] = importTeam(`
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

Vikavolt @ Lum Berry
Level: 46
Timid Nature
Ability: Levitate
- Bug Buzz
- Charge Beam
- Energy Ball
- Agility
`);
      let [player1, player2, player3] = importTeam(`
Aerodactyl
Level: 1
Serious Nature
Ability: Rock Head
- Stone Edge

Aggron @ Wide Lens
Level: 57
Hardy Nature
Ability: Rock Head
IVs: 29 HP / 24 Atk / 18 Def / 3 SpA / 24 SpD / 23 Spe
- Iron Tail
- Rock Tomb
- Stone Edge
- Heavy Slam

Excadrill
Level: 48
Naive Nature
Ability: Sand Force
IVs: 23 HP / 9 Atk / 5 Def / 0 SpA / 29 SpD / 10 Spe
- Drill Run
- Iron Head
- Rock Slide
- Rapid Spin
`);
      let state = new BattleFieldState(
        new PlayerTrainer([], [player1, player2, player3]),
        new CpuTrainer([], [cpu1, cpu2, cpu3]),
        new Field()
      );
      const newState = applyCpuSwitchIns(state);
      expectCpuTeam([{ pokemon: cpu1, firstTurnOut: true }], [cpu2, cpu3], newState);
    
      const doublesState = new BattleFieldState(
        new PlayerTrainer([], [player1, player2, player3]),
        new CpuTrainer([], [cpu1, cpu2, cpu3]),
        new Field({ gameType: 'Doubles' }),
      );

      const newDoublesState = applyCpuSwitchIns(doublesState);
      expectCpuTeam([{ pokemon: cpu1, firstTurnOut: true }, { pokemon: cpu2, firstTurnOut: true }], [cpu3], newDoublesState);
    });

    xit(`Doesn't see player priority KOs`, () => {
    });

    it('Prefer fast outdamage', () => {
      // Twins Tori and Tia
      let [Scrafty, Bruxish, Gothitelle, Bisharp] = importTeam(`
Scrafty @ Sitrus Berry
Level: 45
Jolly Nature
Ability: Intimidate
- Close Combat
- Knock Off
- Foul Play
- Fake Out

Bruxish @ Lum Berry
Level: 45
Jolly Nature
Ability: Dazzling
- Psychic Fangs
- Liquidation
- Crunch
- Bulk Up

Gothitelle @ Sitrus Berry
Level: 44
Timid Nature
Ability: Shadow Tag
- Psychic
- Signal Beam
- Fake Out
- Hypnosis

Bisharp @ Lum Berry
Level: 44
Jolly Nature
Ability: Defiant
- Iron Head
- Sucker Punch
- Knock Off
- Low Kick
`);
      let [player1] = importTeam(`
Aggron @ Wide Lens
Level: 57
Hardy Nature
Ability: Rock Head
IVs: 29 HP / 24 Atk / 18 Def / 3 SpA / 24 SpD / 23 Spe
- Iron Tail
- Rock Tomb
- Stone Edge
- Heavy Slam
`);
      Scrafty = Scrafty.clone({ curHP: 0 });
      let state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(player1)], []),
        new CpuTrainer([new PokemonPosition(Scrafty)], [Bruxish, Gothitelle, Bisharp]),
        new Field()
      );
      const newState = applyCpuSwitchIns(state);
      expectCpuTeam([{ pokemon: Bisharp, firstTurnOut: true }], [Bruxish, Gothitelle, Scrafty], newState);
    
    })

    it('Prefer fastest if all are KOed', () => {
      // Brid Keeper Coby
      let [Golurk, Flapple, Vikavolt] = importTeam(`
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

Vikavolt @ Lum Berry
Level: 46
Timid Nature
Ability: Levitate
- Bug Buzz
- Charge Beam
- Energy Ball
- Agility
`);
      let [player1] = importTeam(`
Aggron @ Wide Lens
Level: 57
Hardy Nature
Ability: Rock Head
IVs: 29 HP / 24 Atk / 18 Def / 3 SpA / 24 SpD / 23 Spe
- Iron Tail
- Rock Tomb
- Stone Edge
- Heavy Slam
`);
      Golurk = Golurk.clone({ curHP: 0 });
      let state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(player1)], []),
        new CpuTrainer([new PokemonPosition(Golurk)], [Flapple, Vikavolt]),
        new Field()
      );
      const newState = applyCpuSwitchIns(state);
      expectCpuTeam([{ pokemon: Flapple, firstTurnOut: true }], [Vikavolt, Golurk], newState);
    
    })
  });
});