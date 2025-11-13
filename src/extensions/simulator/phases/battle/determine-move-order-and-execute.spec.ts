/* eslint-disable max-len */

import {
  Field,
  Pokemon,
} from '@smogon/calc';
import { inGen, importTeam } from '../../test-helper';
import { ActivePokemon, BattleFieldState, PokemonPosition, Trainer } from '../../moveScoring.contracts';
import { generateAllActionCombinations } from './determine-move-order-and-execute';
import { MoveAction, PossibleAction, PossibleTrainerAction } from './move-selection.contracts';
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
      let trainer1: Trainer  = new Trainer('Player', [new PokemonPosition(Gyarados), new PokemonPosition(Armaldo)], []);
      let trainer2: Trainer  = new Trainer('CPU', [new PokemonPosition(Golurk), new PokemonPosition(Flapple)], []);
      let possibleActionsByPokemon: PossibleTrainerAction[][] = [
        generateEqualLikelyhoodActions(trainer1, Gyarados, [Golurk, Flapple]),
        generateEqualLikelyhoodActions(trainer1, Armaldo, [Golurk, Flapple]),
        generateEqualLikelyhoodActions(trainer2, Golurk, [Gyarados, Armaldo]),
        generateEqualLikelyhoodActions(trainer2, Flapple, [Gyarados, Armaldo]),
      ];
      let allPossibleTurns: PossibleTrainerAction[][] = generateAllActionCombinations(possibleActionsByPokemon);
      expect(allPossibleTurns.length).toBe(
        (4 /* moves */ * 2 /* possible targets */)**2 /* per pokemon */ **2 /* per side */); // 4 pokemon, each with 16 possible actions
      const gyaradosActions = allPossibleTurns
        .map(turn => turn.find(action => action.pokemon.pokemon === Gyarados)!);
      const gyaradosTargettingFlapple = gyaradosActions.filter(
        possibleAction => possibleAction?.action.type === 'move' &&
        (possibleAction.action.move.target.type === 'opponent' && 
          possibleAction.action.move.target.slot === 1))
        .map(possibleAction => (possibleAction.action as MoveAction).move.move.name);
      expect(gyaradosTargettingFlapple.length).toBe(allPossibleTurns.length / 2);
      // Each move should be equally represented when targetting Flapple
      const appearingMoves = new Map<string, number>();
      gyaradosTargettingFlapple.forEach(moveName => {
        appearingMoves.set(moveName, (appearingMoves.get(moveName) || 0) + 1);
      });
      appearingMoves.forEach((count, moveName) => {
        expect(count).toBe(gyaradosTargettingFlapple.length / 4);
      });
});
  });
});

function generateEqualLikelyhoodActions(trainer: Trainer, pokemon: Pokemon, targets: Pokemon[]): PossibleTrainerAction[] {
    let possibleActions: PossibleTrainerAction[] = [];

    for (let targetSlot = 0; targetSlot < targets.length; targetSlot++) {
        pokemon.moves.map(moveName => createMove(pokemon, moveName)).forEach(move => {
            possibleActions.push({
                action: {
                  type: 'move',
                  pokemon,
                  move: {
                    move,
                    target: { type: 'opponent', slot: targetSlot }
                  },
                  probability: 1 / (pokemon.moves.length * targets.length)
                },
                pokemon: new PokemonPosition(pokemon),
                slot: { slot: targetSlot },
                trainer,
            });
        });
    }

    return possibleActions;
}