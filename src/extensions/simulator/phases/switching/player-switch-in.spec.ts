/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon, expectPlayerTeam } from '../../test-helper';
import { ActivePokemon, BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from '../../moveScoring.contracts';
import { applyCpuSwitchIns, chooseSwitchIn } from './cpu-switch-in';
import { applyPlayerSwitchIns } from './player-switch-in';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('Player Switch In', () => {
    it('All options for singles', () => {
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
      let [Aerodactyl, Aggron, Excadrill, Kingler] = importTeam(`
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

Kingler
Level: 100
Hardy Nature
Ability: Hyper Cutter
IVs: 3 Atk / 3 Spe
- Aqua Jet
- Crabhammer
`);

      Aerodactyl = Aerodactyl.clone({ curHP: 0 });
      let state = new BattleFieldState(
        'singles',
        new PlayerTrainer([new PokemonPosition(Aerodactyl)], [Aggron, Excadrill, Kingler]),
        new CpuTrainer([new PokemonPosition(cpu1)], [cpu2, cpu3]),
        new Field(),
        new Field(),
      );
      const newStates = applyPlayerSwitchIns(state);
      expect(newStates.length).toBe(3);
      expectPlayerTeam([{ pokemon: Aggron, firstTurnOut: true }], [Excadrill, Kingler, Aerodactyl], newStates[0]);
      expectPlayerTeam([{ pokemon: Excadrill, firstTurnOut: true }], [Aggron, Kingler, Aerodactyl], newStates[1]);
      expectPlayerTeam([{ pokemon: Kingler, firstTurnOut: true }], [Aggron, Excadrill, Aerodactyl], newStates[2]);
    });

  it('All options for doubles', () => {
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
      let [Lopunny, Aerodactyl, Aggron, Excadrill, Kingler] = importTeam(`
Lopunny
Level: 1
Serious Nature
Ability: Cute Charm
- Hyper Beam

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

Kingler
Level: 100
Hardy Nature
Ability: Hyper Cutter
IVs: 3 Atk / 3 Spe
- Aqua Jet
- Crabhammer
`);

      Aerodactyl = Aerodactyl.clone({ curHP: 0 });
      Lopunny = Lopunny.clone({ curHP: 0 });
      let state = new BattleFieldState(
        'doubles',
        new PlayerTrainer([new PokemonPosition(Aerodactyl), new PokemonPosition(Lopunny)], [Aggron, Excadrill, Kingler]),
        new CpuTrainer([new PokemonPosition(cpu1)], [cpu2, cpu3]),
        new Field(),
        new Field(),
      );
      const newStates = applyPlayerSwitchIns(state);
      expect(newStates.length).toBe(6);
      expectPlayerTeam([{ pokemon: Aggron, firstTurnOut: true }, { pokemon: Excadrill, firstTurnOut: true }], [Kingler, Aerodactyl, Lopunny], newStates[0]);
      expectPlayerTeam([{ pokemon: Aggron, firstTurnOut: true }, { pokemon: Kingler, firstTurnOut: true }], [Excadrill, Aerodactyl, Lopunny], newStates[1]);
      expectPlayerTeam([{ pokemon: Excadrill, firstTurnOut: true }, { pokemon: Aggron, firstTurnOut: true }], [Kingler, Aerodactyl, Lopunny], newStates[2]);
      expectPlayerTeam([{ pokemon: Excadrill, firstTurnOut: true }, { pokemon: Kingler, firstTurnOut: true }], [Aggron, Aerodactyl, Lopunny], newStates[3]);
      expectPlayerTeam([{ pokemon: Kingler, firstTurnOut: true }, { pokemon: Aggron, firstTurnOut: true }], [Excadrill, Aerodactyl, Lopunny], newStates[4]);
      expectPlayerTeam([{ pokemon: Kingler, firstTurnOut: true }, { pokemon: Excadrill, firstTurnOut: true }], [Aggron, Aerodactyl, Lopunny], newStates[5]);
    });
  });
});