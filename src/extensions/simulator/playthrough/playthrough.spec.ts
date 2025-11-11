import { Field } from '@smogon/calc';
import { determineMoveOrderAndExecute, getAllPlayerAndCpuPossibleTurns } from '../phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from '../moveScoring.contracts';
import { importTeam } from '../helper';
import { expectTeam, usingHeuristics } from '../test-helper';
import { BasicScoring, IntuitionScoring } from '../phases/battle/player-move-selection-strategy';
import { findPlayerWinningPath } from '../path-finder';

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
          let allPossibleEndStatesOfTurn1 = determineMoveOrderAndExecute(state);
          expect(allPossibleEndStatesOfTurn1.length).toBe(4); // 4 possible outcomes based on the 4 moves of Turtwig

          expect(allPossibleEndStatesOfTurn1.filter(outcome => outcome.state.cpu.active[0].pokemon.curHP() === outcome.state.cpu.active[0].pokemon.maxHP()).length).toBe(2); // Turtwig has 2 non-damaging moves
          expect(allPossibleEndStatesOfTurn1.filter(outcome => outcome.state.cpu.active[0].pokemon.curHP() < outcome.state.cpu.active[0].pokemon.maxHP()).length).toBe(2); // Turtwig has 2 damaging moves
        });
    });

    test('Route 103 - Rival May path', () => {
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
          let path = findPlayerWinningPath(state);
          expect(path).not.toBeNull();
        });
    });
  });
});
