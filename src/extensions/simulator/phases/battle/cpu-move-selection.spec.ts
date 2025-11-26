/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { OpposingTrainer } from '../../../trainer-sets';
import { create1v1BattleState } from '../../helper';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../moveScoring.contracts';
import { getBox } from '../../playthrough/museum.collection';
import { importTeam, inGen } from '../../test-helper';
import { getCpuMoveScoresAgainstTarget, getCpuPossibleActions } from './cpu-move-selection';
import { PossibleAction } from './move-selection.contracts';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('CPU Move selection', () => {
    test(`Slower CPU wins with a priority move`, () => {
      let [cpu, player] = importTeam(`
  Lopunny
  Level: 1
  - Fake out
  - Hyper Beam
  
  Aerodactyl
  Level: 100
  - Stone Edge
  `);
      player = player.clone({ curHP: 1})

      const actions = getCpuActionsFor1v1(cpu, player);
      expect(actions.length).toBe(1);
      expect(actions[0]).toBePossibleAction({
        type: 'move',
        pokemon: cpu,
        move: {
          move: 'Fake Out',
          target: { type: 'opponent', slot: 0 }
        },
        probability: 1
      });
    });

    test(`CPU thinks it lives with focus sash, so doesn't go for priority. Player sees focus sash and goes for multi-hit`, () => {
      let [cpuKrabby, playerAerodactyl] = importTeam(`
    Krabby @ Focus Sash
    Level: 1
    - Aqua Jet
    - Crabhammer
    
    Aerodactyl
    Level: 12
    - Stone Edge
    - Dual Wingbeat
    `);

      expect(playerAerodactyl.stats.spe).toBeGreaterThan(cpuKrabby.stats.spe);
      const actions = getCpuActionsFor1v1(cpuKrabby, playerAerodactyl);
      expect(actions.length).toBe(1);
      expect(actions[0]).toBePossibleAction({
        type: 'move',
        pokemon: cpuKrabby,
        move: {
          move: 'Crabhammer',
          target: { type: 'opponent', slot: 0 }
        },
        probability: 1
      });
    });

    test('CPU will go for slow KO in doubles, even if it will die before it moves, because it scores target scenarios independently.', () => {
      let [Torkoal, Dragapult, Krabby] = importTeam(`
Torkoal
Level: 53
Quiet Nature
Ability: White Smoke
- Flamethrower
- Solar Beam
- Scorching Sands
- Stealth Rock
  
Dragapult
Level: 100
- Stone Edge

Krabby
Level: 50
Serious Nature
Ability: Hyper Cutter
- Splash
- Fake Tears
- Aqua Jet
- Waterfall
  `);
      Torkoal.originalCurHP = 68;

      // Situation: Krabby is slower than Dragapult and is KOd, but Krabby can KO with priority before it dies.
      const state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Torkoal), new PokemonPosition(Dragapult)], []),
        new CpuTrainer([new PokemonPosition(Krabby)], []),
        new Field({ gameType: 'Doubles' }));

      const scores = getCpuMoveScoresAgainstTarget(state, state.cpu.active[0], state.player.active[0], { slot: 0, type: 'opponent' });
      const torkoalActions = getCpuActionsFor1v1(Krabby, Torkoal);
      const dragapultActions = getCpuActionsFor1v1(Krabby, Dragapult);

      expect(torkoalActions.length).toBe(1);
      expect(torkoalActions[0]).toBePossibleAction({
        pokemon: Torkoal,
        type: 'move',
        move: {
          move: 'Waterfall',
          target: { type: 'opponent', slot: 0 }
        },
        probability: 1
      });

      expect(dragapultActions.length).toBe(1);
      expect(dragapultActions[0]).toBePossibleAction({
        pokemon: Dragapult,
        type: 'move',
        move: {
          move: 'Aqua Jet',
          target: { type: 'opponent', slot: 0 }
        },
        probability: 1
      });
    });
  });

  it("Belch isn't used when holding a berry", () => {
    const [, Croagunk,] = OpposingTrainer('Team Aqua Grunt Petalburg Woods');
    const { Starly } = getBox();

    let state = create1v1BattleState(Starly, Croagunk);
    let result = getCpuMoveScoresAgainstTarget(state, state.cpu.active[0], state.player.active[0], { slot: 0, type: 'opponent' });
    let belch = result.find(r => r.move.move.name === 'Belch');
    expect(belch?.finalScore).toBeLessThan(0);

    Croagunk.item = undefined;
    state = create1v1BattleState(Starly, Croagunk);
    result = getCpuMoveScoresAgainstTarget(state, state.cpu.active[0], state.player.active[0], { slot: 0, type: 'opponent' });
    belch = result.find(r => r.move.move.name === 'Belch');
    expect(belch?.finalScore).toBeGreaterThan(0);
  });

  it("Fake out", () => {
    const [, Croagunk,] = OpposingTrainer('Team Aqua Grunt Petalburg Woods');
    const { Turtwig } = getBox();

    const actions = getCpuActionsFor1v1(Croagunk, Turtwig);
    expect(actions.find(a => a.type === 'move' && a.move.move.name === 'Fake Out'))
      .toBePossibleAction({
        type: 'move',
        pokemon: Croagunk,
        move: {
          move: 'Fake Out',
          target: { type: 'opponent', slot: 0 }
        },
        probability: 1
      });
  });
});

function getCpuActionsFor1v1(cpuPokemon: Pokemon, playerPokemon: Pokemon): PossibleAction[] {
  const state = new BattleFieldState(
    new PlayerTrainer(
      [new PokemonPosition(playerPokemon, true)],
      [],
    ),
    new CpuTrainer(
      [new PokemonPosition(cpuPokemon, true)],
      [],
    ),
    new Field()
  );
  return getCpuPossibleActions(state, state.cpu.active[0], state.player.active, state.cpu.active);
}

function getCpuActionsForDoubleBattle(cpuPokemon: Pokemon, playerPokemon: Pokemon[]): PossibleAction[] {
  const state = new BattleFieldState(
    new PlayerTrainer(playerPokemon.map(p => new PokemonPosition(p)), []),
    new CpuTrainer([new PokemonPosition(cpuPokemon)], []),
    new Field({ gameType: 'Doubles' })
  );
  return getCpuPossibleActions(state, state.cpu.active[0], state.player.active, state.cpu.active);
}