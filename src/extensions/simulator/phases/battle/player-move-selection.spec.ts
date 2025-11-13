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

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('Player move scoring', () => {
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
  });
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
  return getPlayerPossibleActions(state, state.player.active[0]);
}