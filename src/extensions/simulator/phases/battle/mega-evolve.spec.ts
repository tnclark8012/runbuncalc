/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {
  I,
  A,
  Field,
  Generations,
  Pokemon
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { createMove, megaEvolve } from '../../moveScoring';
import { getPlayerPossibleActions } from './player-move-selection';
import { isMoveAction, PossibleAction, PossibleMoveAction, PossibleTrainerAction } from './move-selection.contracts';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../../moveScoring.contracts';
import { create1v1BattleState } from '../../helper';
import { executeMegaEvolution } from './mega-evolve';

const RunAndBun = 8;
inGen(RunAndBun, ({ gen, calculate, Pokemon, Move }) => {
  describe('Mega evolve', () => {
    test(`executeMegaEvolution`, () => {
        let [Lopunny, Aerodactyl] = importTeam(`
    Lopunny @ Lopunnite
    Level: 1
    - Fake out
    - Hyper Beam

    Aerodactyl
    Level: 100
    - Stone Edge
    `);

        const state = create1v1BattleState(Lopunny, Aerodactyl);
        const megaLopunny = megaEvolve(Lopunny);
        let action: PossibleTrainerAction = {
            trainer: state.player,
            action: { 
                type: 'move',
                pokemon: megaEvolve(Lopunny),
                move: {
                    move: createMove(megaLopunny, megaLopunny.moves[0]),
                    target: { type: 'opponent', slot: 0 }
                },
                probability: 1
            },
            pokemon: state.player.active[0],
            slot: { slot: 0 }
        };
        const result = executeMegaEvolution(state, [action]);
        expect(result.outcome.player.active[0].pokemon.name).toBe("Lopunny-Mega");
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