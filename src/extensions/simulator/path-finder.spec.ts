import { Field, Pokemon } from '@smogon/calc';
import { determineMoveOrderAndExecute, getAllPlayerAndCpuPossibleTurns } from './phases/battle/determine-move-order-and-execute';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from './moveScoring.contracts';
import { create1v1BattleState, createDoubleBattleState, createSingleBattleState, importTeam } from './helper';
import { expectTeam, usingHeuristics } from './test-helper';
import { BasicScoring, IntuitionScoring } from './phases/battle/player-move-selection-strategy';
import { findPlayerWinningPath, printDecisionTree } from './path-finder';
import { runTurn } from './turn-state';
import { attack, PlannedPlayerActionProvider, switchTo } from '../configuration';
import { PossibleAction, PossibleMoveAction } from './phases/battle/move-selection.contracts';
import { createMove, megaEvolve } from './moveScoring';

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
        new PlayerTrainer([new PokemonPosition(Turtwig, true)], []),
        new CpuTrainer([new PokemonPosition(Torchic, true)], []),
        new Field());

      usingHeuristics({ playerMoveScoringStrategy: BasicScoring }, () => {
        let path = findPlayerWinningPath(state);
        expect(path).not.toBeNull();
      });
    });

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

  describe('Run & Bun Battles', () => {
    describe('Juan split', () => {

      xtest('Beauty Bridget Clefairy', () => {
        let cpuTeam: Pokemon[];
        let [Clefairy, Greninja, Sandslash, Floatzel, Goodra] = cpuTeam = importTeam(`
Clefable @ Life Orb
Level: 91
Timid Nature
Ability: Magic Guard
- Blizzard
- Fire Blast
- Psychic
- Stealth Rock

Greninja @ Lum Berry
Level: 90
Hasty Nature
Ability: Protean
- Blizzard
- Toxic Spikes
- Spikes
- Low Kick

Sandslash-Alola @ Life Orb
Level: 90
Jolly Nature
Ability: Slush Rush
- Iron Head
- Triple Axel
- Earthquake
- Stealth Rock

Floatzel @ Expert Belt
Level: 90
Timid Nature
Ability: Water Veil
- Hydro Pump
- Blizzard
- Focus Blast
- Taunt

Goodra-Hisui @ Leftovers
Level: 91
Impish Nature
Ability: Shell Armor
- Dragon Tail
- Earthquake
- Curse
- Heavy Slam
        `);

        let playerTeam: Pokemon[];
        let [Beedrill, Ampharos, Infernape, Aerodactyl, Urshifu, Primarina] = playerTeam = importTeam(`
Beedrill @ Beedrillite
Level: 91
Calm Nature
Ability: Sniper
IVs: 26 HP / 11 Atk / 19 Def / 19 SpA / 3 SpD / 14 Spe
- Drill Run
- Leech Life
- Poison Jab
- U-turn

Ampharos
Level: 91
Sassy Nature
Ability: Static
IVs: 8 HP / 3 Atk / 28 Def / 13 SpA / 20 SpD / 10 Spe
- Shock Wave
- Dragon Pulse
- Thunderbolt
- Power Gem

Infernape @ Choice Scarf
Level: 91
Naive Nature
Ability: Vital Spirit
IVs: 23 Def / 30 SpA / 16 SpD
- Overheat
- Mach Punch
- Close Combat
- Fake Out

Aerodactyl
Level: 91
Bashful Nature
Ability: Rock Head
IVs: 24 HP / 11 Atk / 14 Def / 9 SpA / 19 SpD / 3 Spe
- Double-Edge
- Dual Wingbeat
- Stone Edge
- Tailwind

Urshifu
Level: 91
Naive Nature
Ability: Unseen Fist
IVs: 21 SpA / 23 SpD
- Wicked Blow
- Sucker Punch
- Close Combat
- Iron Head

Primarina @ Choice Specs
Level: 91
Quiet Nature
Ability: Torrent
IVs: 19 HP / 5 Def / 15 SpA / 28 SpD / 4 Spe
- Draining Kiss
- Flip Turn
- Surf
- Encore
        `);

        const state = createSingleBattleState(playerTeam, cpuTeam);
        state.field.weather = 'Hail';
        // const possibleTurn1Outcomes = runTurn(state);
        // expect(possibleTurn1Outcomes.length).toBeGreaterThan(0);
        // const exampleTurn1 = possibleTurn1Outcomes[0];
        // const turn2Outcomes = runTurn(exampleTurn1.state);

        usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider([
          [ attack(Beedrill, 'Poison Jab', true) ],
        ]) }, () => {
          const path = findPlayerWinningPath(state);
          expect(path).not.toBeNull();
          expect(printDecisionTree(path)).toBe(``);
        });
      });

      test('Lady Daphne', () => {
        let cpuTeam: Pokemon[];
        let [Ribombee, Bruxish, CpuPrimarina, SamurottHisui, CpuDragapult, Roserade] = cpuTeam = importTeam(`
Ribombee @ Focus Sash
Level: 90
Timid Nature
Ability: Shield Dust
- Moonblast
- Bug Buzz
- Psychic
- Sticky Web

Bruxish @ Tanga Berry
Level: 91
Jolly Nature
Ability: Strong Jaw
- Liquidation
- Psychic Fangs
- Crunch
- Swords Dance

Primarina @ Kebia Berry
Level: 91
Timid Nature
Ability: Liquid Voice
- Hyper Voice
- Draining Kiss
- Psychic
- Calm Mind

Samurott-Hisui @ Chople Berry
Level: 91
Jolly Nature
Ability: Shell Armor
- Liquidation
- Knock Off
- Sacred Sword
- Swords Dance

Dragapult @ Power Herb
Level: 89
Adamant Nature
Ability: Clear Body
- Dragon Darts
- Phantom Force
- Aqua Tail
- Infestation

Roserade @ Life Orb
Level: 90
Timid Nature
Ability: Technician
- Sludge Bomb
- Extrasensory
- Sleep Powder
- Grass Knot
        `);

        let playerTeam: Pokemon[];
        let [Excadrill, Dragapult, Tsareena, Primarina, Urshifu, Corviknight] = playerTeam = importTeam(`
Excadrill @ Sitrus Berry
Level: 91
Naive Nature
Ability: Sand Force
IVs: 23 HP / 9 Atk / 5 Def / 0 SpA / 29 SpD / 10 Spe
- Earthquake
- Iron Head
- High Horsepower
- Rapid Spin

Dragapult @ Sitrus Berry
Level: 91
Adamant Nature
Ability: Infiltrator
IVs: 26 HP / 25 Atk / 28 Def / 19 SpA / 17 SpD / 6 Spe
- Dragon Darts
- Draco Meteor
- Sucker Punch
- Phantom Force

Tsareena @ Wide Lens
Level: 91
Hardy Nature
Ability: Sweet Veil
IVs: 12 HP / 27 Atk / 20 Def / 7 SpA / 20 SpD / 30 Spe
- Trop Kick
- Rapid Spin
- Magical Leaf
- Power Whip

Primarina @ Sitrus Berry
Level: 91
Quiet Nature
Ability: Torrent
IVs: 19 HP / 5 Def / 15 SpA / 28 SpD / 4 Spe
- Draining Kiss
- Flip Turn
- Surf
- Encore

Urshifu @ Life Orb
Level: 91
Naive Nature
Ability: Unseen Fist
IVs: 21 SpA / 23 SpD
- Wicked Blow
- Sucker Punch
- Close Combat
- Iron Head

Corviknight @ Chesto Berry
Level: 91
Calm Nature
Ability: Unnerve
IVs: 13 HP / 2 Atk / 16 Def / 23 SpA / 21 SpD / 14 Spe
- Brave Bird
- Defog
- Feather Dance
- Roost
        `);

        const state = createSingleBattleState(playerTeam, cpuTeam);
        state.field.weather = 'Hail';

        usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider(
          [ 
            [attack(Excadrill, 'Rapid Spin')],
            [attack(Excadrill, 'Iron Head')],
            [switchTo(Dragapult)], // Bruxish
            [attack(Dragapult, 'Phantom Force')],
            [attack(Dragapult, 'Phantom Force')],//2nd turn of phantom force
            [switchTo(Urshifu)], // Dragapult
            [attack(Urshifu, 'Sucker Punch')],
            [switchTo(Tsareena)], // Prim
            [attack(Tsareena, 'Power Whip')],
            [switchTo(Corviknight)], // Roserade
            [attack(Corviknight, 'Brave Bird')],
            [switchTo(Primarina)], // Samurott
            [attack(Primarina, 'Draining Kiss')],
            [attack(Primarina, 'Draining Kiss')]
          ]) }, () => {
          const path = findPlayerWinningPath(state);
          expect(path).not.toBeNull();
        });

        const path = findPlayerWinningPath(state);
        let pathString = printDecisionTree(path);
        expect(pathString).not.toBeNull();
      });
    });
  });
});