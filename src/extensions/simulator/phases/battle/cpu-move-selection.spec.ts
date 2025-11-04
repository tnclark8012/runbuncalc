/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon, expectPlayerTeam, expectCpuTeam } from '../../test-helper';
import { ActivePokemon, BattleFieldState } from '../../moveScoring.contracts';
import { generateAllActionCombinations } from './determine-move-order-and-execute';
import { MoveAction, PossibleAction, PossiblePokemonAction, PossiblePokemonActions } from './move-selection.contracts';
import { createMove } from '../../moveScoring';
import { getCpuMoveScoresAgainstTarget, getCpuPossibleActions } from './cpu-move-selection';
import { get } from 'jquery';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('Move selection', () => {
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
      player.originalCurHP = 1;

      const actions = getCpuActionsFor1v1(cpu, player);
      expect(actions.length).toBe(1);
      expect(actions[0]).toBePossibleAction({
        action: {
          type: 'move',
          move: {
            move: 'Fake Out',
            target: { type: 'opponent', slot: 0 }
          },
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
        action: {
          type: 'move',
          move: {
            move: 'Crabhammer',
            target: { type: 'opponent', slot: 0 }
          },
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
      const state = new BattleFieldState('doubles', [{ pokemon: Torkoal }, { pokemon: Dragapult }], [{ pokemon: Krabby }], [], [], new Field(), new Field());
      const scores = getCpuMoveScoresAgainstTarget(state, state.cpuActive[0], state.playerActive[0], { slot: 0, type: 'opponent'});
      const torkoalActions = getCpuActionsFor1v1(Krabby, Torkoal);
      const dragapultActions = getCpuActionsFor1v1(Krabby, Dragapult);

      expect(torkoalActions.length).toBe(1);
      expect(torkoalActions[0]).toBePossibleAction({
        action: {
          type: 'move',
          move: {
            move: 'Waterfall',
            target: { type: 'opponent', slot: 0 }
          },
        },
        probability: 1
      });

      expect(dragapultActions.length).toBe(1);
      expect(dragapultActions[0]).toBePossibleAction({
        action: {
          type: 'move',
          move: {
            move: 'Aqua Jet',
            target: { type: 'opponent', slot: 0 }
          },
        },
        probability: 1
      });
    });
  });
});

function getCpuActionsFor1v1(cpuPokemon: Pokemon, playerPokemon: Pokemon): PossibleAction[] {
  const state = new BattleFieldState(
    'singles',
    [{ pokemon: playerPokemon }],
    [{ pokemon: cpuPokemon }],
    [],
    [],
    new Field(),
    new Field()
  );
  return getCpuPossibleActions(state, state.cpuActive[0], state.playerActive, state.cpuActive);
}

function getCpuActionsForDoubleBattle(cpuPokemon: Pokemon, playerPokemon: Pokemon[]): PossibleAction[] {
  const state = new BattleFieldState(
    'doubles',
    playerPokemon.map(pokemon => ({ pokemon })),
    [{ pokemon: cpuPokemon }],
    [],
    [],
    new Field(),
    new Field()
  );
  return getCpuPossibleActions(state, state.cpuActive[0], state.playerActive, state.cpuActive);
}