/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam, importPokemon, expectPlayerTeam, expectCpuTeam } from '../../test-helper';
import { ActivePokemon, BattleFieldState } from '../../moveScoring.contracts';
import { generateAllActionCombinations } from './determine-move-order-and-execute';
import { PossibleAction, PossiblePokemonActions } from './move-selection.contracts';
import { createMove } from '../../moveScoring';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('Determine move order and execute', () => {
    it('generateAllActionCombinations', () => {
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

      let possibleActionsByPokemon: PossiblePokemonActions[] = [
        generateEqualLikelyhoodActions(Gyarados, [Golurk, Flapple]),
        generateEqualLikelyhoodActions(Armaldo, [Golurk, Flapple]),
        generateEqualLikelyhoodActions(Golurk, [Gyarados, Armaldo]),
        generateEqualLikelyhoodActions(Flapple, [Gyarados, Armaldo]),
      ];
      let allCombinations = generateAllActionCombinations(possibleActionsByPokemon);
      expect(allCombinations.length).toBe(
        (4 /* moves */ * 2 /* possible targets */)**2 /* per pokemon */ **2 /* per side */); // 4 pokemon, each with 16 possible actions
    });
  });
});

function generateEqualLikelyhoodActions(pokemon: Pokemon, targets: Pokemon[]): PossiblePokemonActions {
    let possibleActions: PossibleAction[] = [];

    for (let targetSlot = 0; targetSlot < targets.length; targetSlot++) {
        pokemon.moves.map(moveName => createMove(pokemon, moveName)).forEach(move => {
            possibleActions.push({
                action: { type: 'move', move: { move: move, target: { type: 'opponent', slot: targetSlot } } },
                probability: 1 / (pokemon.moves.length * targets.length)
            });
        });
    }

    return {
        pokemon: { pokemon: pokemon },
        possibleActions

    }
}