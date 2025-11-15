/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {
  Field,
  Pokemon
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { getPlayerPossibleActions } from './player-move-selection';
import { isMoveAction, PossibleAction } from './move-selection.contracts';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../moveScoring.contracts';
import { getBox } from '../../playthrough/museum.collection';
import { Trainers } from '../../../trainer-sets';

describe('Player Move Selection', () => {
  describe('Mega evolution', () => {
    test(`Considers mega evolving`, () => {
      let [Lopunny, Aerodactyl] = importTeam(`
Lopunny @ Lopunnite
Level: 1
- Fake out
- Hyper Beam

Aerodactyl
Level: 100
- Stone Edge
`);

      let possibleActions = getPlayerActionsFor1v1(Lopunny, Aerodactyl);
      expect(possibleActions.length).toBe(4); // 2 moves + 2 mega moves
      expect(possibleActions.filter(action => isMoveAction(action) && action.pokemon.name === "Lopunny-Mega").length).toBe(2);
      expect(possibleActions.filter(action => isMoveAction(action) && action.pokemon.name === "Lopunny").length).toBe(2);
    });
  });

  describe('Switches', () => {
    test('Any time switching', () => {
      let { Gossifleur, Turtwig, Starly, Poochyena } = getBox();
      let [Grubbin, Pineco, Sizzlipede] = Trainers['Bug Catcher Rick'];

      // Grubbin = Grubbin.clone({ curHP: 0 });
      let state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Turtwig)], [Gossifleur, Starly, Poochyena]),
        new CpuTrainer([new PokemonPosition(Grubbin, true)], [Pineco, Sizzlipede]),
        new Field()
      );

      let actions = getPlayerPossibleActions(state);
      expect(actions.length).toBe(1);
      let actionsForTurtwig = actions[0];
      expect(actionsForTurtwig.filter(action => action.action.type === 'switch').length).toBe(3);
    });
  })
});

function getPlayerActionsFor1v1(playerPokemon: Pokemon, cpuPokemon: Pokemon): PossibleAction[] {
  const state = new BattleFieldState(
    new PlayerTrainer(
      [new PokemonPosition(playerPokemon)],
      [],
    ),
    new CpuTrainer(
      [new PokemonPosition(cpuPokemon)],
      [],
    ),
    new Field()
  );
  let possibleActions = getPlayerPossibleActions(state);
  return possibleActions[0].map(p => p.action);
}