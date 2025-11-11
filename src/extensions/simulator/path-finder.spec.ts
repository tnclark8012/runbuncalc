import { Field } from '@smogon/calc';
import { determineMoveOrderAndExecute, getAllPlayerAndCpuPossibleTurns } from './phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from './moveScoring.contracts';
import { importTeam } from './helper';
import { expectTeam, usingHeuristics } from './test-helper';
import { BasicScoring, IntuitionScoring } from './phases/battle/player-move-selection-strategy';
import { findPlayerWinningPath } from './path-finder';

describe('Path finding', () => {
  describe('Branching', () => {
    test('CPU move is 50-50', () => {
      let [Torchic, Turtwig] = importTeam(`
Torchic
Level: 5
Bashful Nature
Ability: Blaze
- Seismic Toss
- Night Shade

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
        // Torchic = Torchic.clone({ curHP: 1 });
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
