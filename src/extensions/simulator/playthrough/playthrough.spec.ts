import { Field } from '@smogon/calc';
import { getAllPlayerAndCpuPossibleTurns } from '../phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from '../moveScoring.contracts';
import { importTeam } from '../helper';
import { usingHeuristics } from '../test-helper';
import { BasicScoring, IntuitionScoring } from '../phases/battle/player-move-selection-strategy';

describe('Actual playthrough tests', () => {
  describe('Museum Split', () => {
    test('Route 103 - Rival May', () => {
      let [Torchic, Turtwig] = importTeam(`
Torchic
Level: 5
Bashful Nature
Ability: Blaze
- Ember
- Scratch
- Growl

Turtwig
Level: 12
Hardy Nature
Ability: Shell Armor
IVs: 20 HP / 27 Atk / 8 SpA
- Absorb
- Bite
- Confide
- Growl

`);
        const state = new BattleFieldState(
          'singles', 
          new PlayerTrainer([ new PokemonPosition(Turtwig, true) ], []),
          new CpuTrainer([ new PokemonPosition(Torchic, true) ], []),
          new Field(), 
          new Field());
        
        usingHeuristics({ playerMoveScoringStrategy: BasicScoring }, () => {
          let possibleTurns = getAllPlayerAndCpuPossibleTurns(state);
          expect(possibleTurns.length).toBe(4); // Turtwig has 4 moves, Torchic has 1 move
        });

        usingHeuristics({ playerMoveScoringStrategy: IntuitionScoring }, () => {
          let possibleTurns = getAllPlayerAndCpuPossibleTurns(state);
          expect(possibleTurns.length).toBe(1); // Turtwig has 1 best move, Torchic has 1 move
        });
    });
  });
});
