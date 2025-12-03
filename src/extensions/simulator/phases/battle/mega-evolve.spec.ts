/* eslint-disable max-len */

import { create1v1BattleState } from '../../helper';
import { createMove, megaEvolve } from '../../moveScoring';
import { importTeam, inGen } from '../../test-helper';
import { executeMegaEvolution } from './mega-evolve';
import { PossibleTrainerAction } from './move-selection.contracts';

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