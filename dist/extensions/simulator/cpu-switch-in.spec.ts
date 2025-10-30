/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { ActivePokemon, BattleFieldState } from './moveScoring.contracts';
import { applyCpuSwitchIns, chooseSwitchIn } from './cpu-switch-in';

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
        'singles',
        [],
        [],
        [player1, player2, player3],
        [cpu1, cpu2, cpu3],
        new Field(),
        new Field(),
      );
      const newState = applyCpuSwitchIns(state);
      expectPlayerTeam([{ pokemon: player1, firstTurnOut: true }], [player2, player3], newState);
      expectCpuTeam([{ pokemon: cpu1, firstTurnOut: true }], [cpu2, cpu3], newState);
    
      const doublesState = new BattleFieldState(
        'singles',
        [],
        [],
        [player1, player2, player3],
        [cpu1, cpu2, cpu3],
        new Field(),
        new Field(),
      );
      
      const newDoublesState = applyCpuSwitchIns(doublesState);
      expectPlayerTeam([{ pokemon: player1, firstTurnOut: true }, { pokemon: player2, firstTurnOut: true }], [player3], newDoublesState);
      expectCpuTeam([{ pokemon: cpu1, firstTurnOut: true }, { pokemon: cpu2, firstTurnOut: true }], [cpu3], newDoublesState);
    });

    xit('Prefer fast OHKO', () => {
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
      // const switchIn = applyCpuSwitchIns(cpuParty, playerMon, state);
      // expect(switchIn.id).toBe('mewtwo');
    });

    xit(`Doesn't see player priority KOs`, () => {
    });
  });
});

function expectCpuTeam(active: ActivePokemon[], party: Pokemon[], state: BattleFieldState): void {
  expectTeam({ active, party }, { active: state.cpuActive, party: state.cpuParty });
}

function expectPlayerTeam(active: ActivePokemon[], party: Pokemon[], state: BattleFieldState): void {
  expectTeam({ active, party }, { active: state.playerActive, party: state.playerParty });
}

function expectTeam(expected: { active: ActivePokemon[], party: Pokemon[] }, actual: { active: ActivePokemon[], party: Pokemon[] }): void {
  expect(actual.active.map(p => p.pokemon.id )).toEqual(expected.active.map(p => p.pokemon.id));
  expect(actual.party.map(p => p.id)).toEqual(expected.party.map(p => p.id));
}