import { Field } from '@smogon/calc';
import { determineMoveOrderAndExecute, getAllPlayerAndCpuPossibleTurns } from './phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from './moveScoring.contracts';
import { create1v1BattleState, importTeam } from './helper';
import { expectTeam, usingHeuristics } from './test-helper';
import { BasicScoring, IntuitionScoring } from './phases/battle/player-move-selection-strategy';
import { findPlayerWinningPath, printDecisionTree } from './path-finder';

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
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], []),
        new CpuTrainer([new PokemonPosition(Torchic, true)], []),
        new Field(),
        new Field());

      usingHeuristics({ playerMoveScoringStrategy: BasicScoring }, () => {
        let path = findPlayerWinningPath(state);
        expect(path).not.toBeNull();
        expect(printDecisionTree(path!)).toBe('');
      });
    });
  });

  describe('Run & Bun Battles', () => {
    test('Beauty Bridget Clefairy vs. Player mega beedrill', () => {
      let [Clefairy, Beedrill] = importTeam(`
Clefable @ Life Orb
Level: 91
Timid Nature
Ability: Magic Guard
- Blizzard
- Fire Blast
- Psychic
- Stealth Rock

Beedrill @ Beedrillite
Level: 91
Calm Nature
Ability: Sniper
IVs: 26 HP / 11 Atk / 19 Def / 19 SpA / 3 SpD / 14 Spe
- Drill Run
- Leech Life
- Poison Jab
- U-turn
`);
        // Mega beedrill changes to outspeeding and OHKOing
        const state = create1v1BattleState(Beedrill, Clefairy);
        let path = findPlayerWinningPath(state);
        expect(path).not.toBeNull();
    });
  });
});
