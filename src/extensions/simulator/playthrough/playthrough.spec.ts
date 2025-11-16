import { Field } from '@smogon/calc';
import { determineMoveOrderAndExecute, getAllPlayerAndCpuPossibleTurns } from '../phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from '../moveScoring.contracts';
import { importTeam } from '../helper';
import { expectTeam, usingHeuristics } from '../test-helper';
import { BasicScoring, IntuitionScoring } from '../phases/battle/player-move-selection-strategy';
import { findPlayerWinningPath, printDecisionTree } from '../path-finder';
import { getBox } from './museum.collection';
import { Trainers } from '../../trainer-sets';
import { attack, PlannedPlayerActionProvider, switchTo } from '../../configuration';
import { ItemName } from '@smogon/calc/dist/data/interface';

describe('Actual playthrough tests', () => {
  describe('Aqua Grunt Split', () => {
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
      const cpu = Trainers['Bug Catcher Rick'];

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
      const cpu = Trainers['Triathlete Mikey'];

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
        // usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider([
        //   [ attack(Turtwig, 'Bite') ],
        //   [ attack(Turtwig, 'Absorb') ],
        //   [ attack(Turtwig, 'Absorb') ],
        //   [ switchTo(Starly) ],
        //   [ attack(Starly, 'Aerial Ace') ],
        //   [ attack(Starly, 'Quick Attack') ],
        //   [ switchTo(Surskit) ],
        //   [ attack(Surskit, 'Bubble Beam') ],
        //   [ attack(Surskit, 'Bubble Beam') ],
        // ]) }, () => {
          const path = findPlayerWinningPath(state);
          expect(path).not.toBeNull();
          // expect(printDecisionTree(path!)).toBe('');
        // });
    });

    test('Fisherman Darian', () => {
      const cpu = Trainers['Fisherman Darian'];

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


  });
});
