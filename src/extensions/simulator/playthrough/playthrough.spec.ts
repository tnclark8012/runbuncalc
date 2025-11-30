import { Field } from '@smogon/calc';
import { OpposingTrainer } from '../../trainer-sets';
import { importTeam } from '../helper';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../moveScoring.contracts';
import { findPlayerWinningPath, printDecisionTree } from '../path-finder';
import { determineMoveOrderAndExecute } from '../phases/battle/determine-move-order-and-execute';
import { BasicScoring } from '../phases/battle/player-move-selection-strategy';
import { usingHeuristics } from '../test-helper';
import { getBox } from './museum.collection';

describe('Actual playthrough tests', () => {
  describe('Team Aqua Grunt Petalburg Woods', () => {
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
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], []),
        new CpuTrainer([new PokemonPosition(Torchic, true)], []),
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
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], []),
        new CpuTrainer([new PokemonPosition(Torchic, true)], []),
        new Field());

      usingHeuristics({ playerMoveScoringStrategy: BasicScoring }, () => {
        let path = findPlayerWinningPath(state);
        expect(path).not.toBeNull();
        // expect(printDecisionTree(path!)).toBe('');
      });
    });

    test('Bug Catcher Rick', () => {
      const cpu = OpposingTrainer('Bug Catcher Rick');

      const { Turtwig, Gossifleur, Poochyena, Starly, Surskit } = getBox();
      const state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], [
          Gossifleur,
          Poochyena,
          Starly,
          Surskit,
        ]),
        new CpuTrainer([], cpu),
        new Field());

      let path = findPlayerWinningPath(state);
      expect(path).not.toBeNull();
    });

    test('Triathlete Mikey', () => {
      const cpu = OpposingTrainer('Triathlete Mikey');

      const { Turtwig, Gossifleur, Poochyena, Starly, Surskit } = getBox();
      const state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], [
          Gossifleur,
          Poochyena,
          Starly,
          Surskit,
        ]),
        new CpuTrainer([], cpu),
        new Field());

      Turtwig.item = 'Oran Berry' as any;
      Gossifleur.item = 'Oran Berry' as any;
      Poochyena.item = 'Oran Berry' as any;
      Starly.item = 'Oran Berry' as any;
      Surskit.item = 'Oran Berry' as any;
     
      const path = findPlayerWinningPath(state);
      expect(path).not.toBeNull();
      // expect(printDecisionTree(path!)).toBe('');
    });

    test('Fisherman Darian', () => {
      const cpu = OpposingTrainer('Fisherman Darian');

      const { Turtwig, Gossifleur, Poochyena, Starly, Surskit } = getBox();
      const state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Starly, true)], [
          Gossifleur,
          Poochyena,
          Turtwig,
          Surskit,
        ]),
        new CpuTrainer([], cpu),
        new Field());

      Turtwig.item = 'Oran Berry' as any;
      Gossifleur.item = 'Oran Berry' as any;
      Poochyena.item = 'Oran Berry' as any;
      Starly.item = 'Oran Berry' as any;
      Surskit.item = 'Oran Berry' as any;
      // usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider([
      //   [ attack(Starly, 'Quick Attack') ],
      //   [ attack(Starly, 'Aerial Ace') ],
      //   [ attack(Starly, 'Quick Attack') ],
      //   [ attack(Starly, 'Aerial Ace') ],
      //   [ switchTo(Gossifleur) ],
      //   [ attack(Gossifleur, 'Leafage') ],
      //   [ attack(Gossifleur, 'Leafage') ],
      // ]) }, () => {
      const path = findPlayerWinningPath(state);
      expect(path).not.toBeNull();
      // expect(printDecisionTree(path!)).toBe('');
      // });
    });

    test('Team Aqua Grunt Petalburg Woods', () => {
      const cpu = OpposingTrainer('Team Aqua Grunt Petalburg Woods');

      const { Turtwig, Gossifleur, Poochyena, Starly, Surskit } = getBox();
      const state = new BattleFieldState(
        new PlayerTrainer([new PokemonPosition(Starly, true)], [
          Gossifleur,
          Poochyena,
          Turtwig,
          Surskit,
        ]),
        new CpuTrainer([], cpu),
        new Field());

      Turtwig.item = 'Oran Berry' as any;
      Gossifleur.item = 'Oran Berry' as any;
      Poochyena.item = 'Oran Berry' as any;
      Starly.item = 'Oran Berry' as any;
      Surskit.item = 'Oran Berry' as any;
      // usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider([
      //   [ attack(Starly, 'Quick Attack') ],
      //   [ attack(Starly, 'Aerial Ace') ],
      //   [ attack(Starly, 'Quick Attack') ],
      //   [ attack(Starly, 'Aerial Ace') ],
      //   [ switchTo(Gossifleur) ],
      //   [ attack(Gossifleur, 'Leafage') ],
      //   [ attack(Gossifleur, 'Leafage') ],
      // ]) }, () => {
      const path = findPlayerWinningPath(state, 0.7);
      expect(path).not.toBeNull();
      // expect(printDecisionTree(path!)).toBe('');
      // });
    });
  });
});
