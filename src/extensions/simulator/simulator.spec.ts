/* eslint-disable max-len */

import { Dex } from '@pkmn/dex';
import {
  I,
  A,
  Field,
  Generations,
  Pokemon
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { TurnOutcome } from './moveScoring.contracts';
import { BattleSimulator } from './simulator';

const RunAndBun = 8;
inGen(RunAndBun, ({gen, calculate, Pokemon, Move}) => {
  describe('Custom tests for calculator', () => {
    describe('Move selection', () => {
      test(`Slower CPU wins with a priority move`, () => {
        let [cpu, player] = importTeam(`
Lopunny
Level: 1
- Fake out
- Hyper Beam

Aerodactyl
Level: 100
- Stone Edge
`);
        player.originalCurHP = 1;
        let battleSimulator = new BattleSimulator(Generations.get(gen), player, cpu, new Field());
        const result = battleSimulator.getResult();
        expect(result.winner.name).toEqual('Lopunny');
      });

      test(`CPU thinks it lives with focus sash, so doesn't go for priority. Player sees focus sash and goes for multi-hit`, () => {
                let [cpuKrabby, playerAerodactyl] = importTeam(`
Krabby @ Focus Sash
Level: 1
- Aqua Jet
- Crabhammer

Aerodactyl
Level: 12
- Stone Edge
- Dual Wingbeat
`);  

          expect(playerAerodactyl.stats.spe).toBeGreaterThan(cpuKrabby.stats.spe);
          
          let battleSimulator = new BattleSimulator(Generations.get(gen), playerAerodactyl, cpuKrabby, new Field());
          const result = battleSimulator.getResult();
          expectTurn(
            result.turnOutcomes[0], 
            { pokemon: playerAerodactyl, move: 'Dual Wingbeat' }
          )
          expect(result.winner.name).toEqual('Aerodactyl');
          expect(result.turnOutcomes[0].endOfTurnState.cpu.active[0].pokemon.item).toBeUndefined();
          
          expect(result.turnOutcomes.length).toBe(1);
      });
    });

    describe('Turn sequence', () => {

      test('Damage recovery', () => {
let [playerGolisopod, cpuAppletun] = importTeam(`
Golisopod
Level: 100
Ability: Emergency Exit
- Leech Life

Appletun @ Lum Berry
Level: 100
Ability: Thick Fat
- Dragon Pulse
- Apple Acid
`); 

          let battleSimulator = new BattleSimulator(Generations.get(gen), playerGolisopod, cpuAppletun, new Field());
          const result = battleSimulator.getResult({ maxTurns: 2 });
          
          const [turn1, turn2] = result.turnOutcomes;
          expect(turn1.actions[0].attacker.equals(playerGolisopod)).toBe(true);
          expect(turn1.endOfTurnState.player.active[0].pokemon.curHP()).toBeLessThan(playerGolisopod.maxHP());
          const goliDamageTaken = turn1.actions[1].lowestRollPerHitDamage;
          expect(turn2.endOfTurnState.player.active[0].pokemon.curHP()).toBe(playerGolisopod.maxHP()); 
      });

      test('stat changes from moves take effect after the turn', () => {
        let [cpuKrabby, playerInfernape] = importTeam(`
Krabby
Level: 100
- Swords Dance

Infernape
Level: 5
- Close Combat
`); 

          let battleSimulator = new BattleSimulator(Generations.get(gen), playerInfernape, cpuKrabby, new Field());
          const result = battleSimulator.getResult({ maxTurns: 1 });
          expect(result.turnOutcomes.length).toBe(1);
          expectTurn(
            result.turnOutcomes[0], 
            { pokemon: cpuKrabby, move: 'Swords Dance' },
            { pokemon: playerInfernape, move: 'Close Combat' },
          )
          expect(result.turnOutcomes[0].endOfTurnState.cpu.active[0].pokemon.boosts.atk).toBe(2);
          expect(result.turnOutcomes[0].endOfTurnState.player.active[0].pokemon.boosts.def).toBe(-1);
          expect(result.turnOutcomes[0].endOfTurnState.player.active[0].pokemon.boosts.spd).toBe(-1);
      });

      test('Turns contain immutable state', () => {
        let [greninja, combusken] = importTeam(`
Greninja @ White Herb
Level: 100
Ability: Intimidate
Hardy Nature
- Close Combat

Combusken @ Focus Sash
Level: 2
Naughty Nature
Ability: Speed Boost
- Double Kick
- Incinerate
- Thunder Punch
- Work Up
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), greninja, combusken, new Field());
          const result = battleSimulator.getResult();
          expect(result.turnOutcomes.length).toBe(2);
          let [turn1, turn2] = result.turnOutcomes;
          
          expectTurn(
            turn1,
            { pokemon: greninja, move: 'Close Combat' },
            { pokemon: combusken, move: 'Double Kick' }
          );

          expectTurn(
            turn2,
            { pokemon: greninja, move: 'Close Combat' }
          )

          // Greninja's white herb should have restored the stat drops from CC
          expect(turn1.endOfTurnState.player.active[0].pokemon.item).toBeUndefined();
          expect(turn1.endOfTurnState.player.active[0].pokemon.boosts.def).toBe(0);
          expect(turn1.endOfTurnState.player.active[0].pokemon.boosts.spd).toBe(0);
          expect(turn1.endOfTurnState.cpu.active[0].pokemon.curHP()).toBe(1);
          expect(result.turnOutcomes[0].endOfTurnState.cpu.active[0].pokemon.boosts.spe).toBe(1);

          expect(turn2.endOfTurnState.player.active[0].pokemon.boosts.def).toBe(-1);
          expect(turn2.endOfTurnState.player.active[0].pokemon.boosts.spd).toBe(-1);
          expect(turn2.endOfTurnState.cpu.active[0].pokemon.boosts.spe).toBe(1);
          expect(turn2.endOfTurnState.cpu.active[0].pokemon.curHP()).toBe(0);
      });

      test('Abilities that activate on switch-in', () => {
        let [Krabby, Aerodactyl] = importTeam(`
Krabby @ Focus Sash
Level: 12
- Aqua Jet
- Crabhammer

Aerodactyl
Level: 12
Ability: Intimidate
- Stone Edge
`);
          Aerodactyl.abilityOn = true;

          let battleSimulator = new BattleSimulator(Generations.get(gen), Aerodactyl, Krabby, new Field());
          const result = battleSimulator.getResult();
          expect(result.turnOutcomes.length).toBe(2);
          let [turn1, turn2] = result.turnOutcomes;
          
          expectTurn(
            turn1,
            { pokemon: Aerodactyl, move: 'Stone Edge' },
            { pokemon: Krabby, move: 'Crabhammer' }
          );

          expectTurn(
            turn2,
            { pokemon: Krabby, move: 'Aqua Jet' },
          )

          // Intimidate should only activate once
          expect(turn1.endOfTurnState.cpu.active[0].pokemon.boosts.atk).toBe(-1);
          expect(turn2.endOfTurnState.cpu.active[0].pokemon.boosts.atk).toBe(-1);
      });
    });

    describe('Run & Bun Battles', () => {
      test('Brawly - Tirtouga vs. Combusken: Riskless', () => {
        let [tirtouga, combusken] = importTeam(`
Tirtouga
Level: 21
Hardy Nature
Ability: Solid Rock
IVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe
- Smack Down
- Brine
- Aqua Jet
- Bite

Combusken @ Lum Berry
Level: 20
Naughty Nature
Ability: Speed Boost
- Double Kick
- Incinerate
- Thunder Punch
- Work Up
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), tirtouga, combusken, new Field());
          const result = battleSimulator.getResult();
          expectTurn(
            result.turnOutcomes[0],
            { pokemon: combusken, move: 'Double Kick' },
            { pokemon: tirtouga, move: 'Brine' },
          )
          expect(result.turnOutcomes[0].endOfTurnState.cpu.active[0].pokemon.boosts.spe).toBe(1);
          expectTurn(
            result.turnOutcomes[1],
            { pokemon: tirtouga, move: 'Aqua Jet' },
          )
      });

      test('Ninja Boy Lung - Corviknight vs. Greninja: Slow KOs because of Protean type change', () => {
        // Give Corviknight Body Press which is higher damage to Water/Dark Greninja to make sure we're accounting for Protean
        let [Corviknight, Greninja] = importTeam(`
Corviknight
Level: 48
Calm
Ability: Unnerve
IVs: 13 HP / 2 Atk / 16 Def / 23 SpA / 21 SpD / 14 Spe
- Brave Bird
- Body Press
- Scary Face
- Feather Dance

Greninja
Level: 45
Hasty Nature
Ability: Protean
- Water Shuriken
- Gunk Shot
- Acrobatics
- Low Kick
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), Corviknight, Greninja, new Field());
          const result = battleSimulator.getResult();
          expectTurn(
            result.turnOutcomes[0],
            { pokemon: Greninja, move: 'Low Kick' },
            { pokemon: Corviknight, move: 'Brave Bird' },
          )
          expect(result.winner.id).toBe(Corviknight.id);
      });

      test('Team Aqua Grunt Aqua Hideout #7 - Gilscor vs. Cloyster: Skill link Icicle Spear KOs', () => {
        let [Cloyster, Gilscor] = importTeam(`
Cloyster
Level: 81
Lax Nature
Ability: Skill Link
IVs: 5 HP / 27 Atk / 13 Def / 21 SpA / 10 SpD / 18 Spe
- Rapid Spin
- Ice Shard
- Icicle Spear
- Rock Blast

Gliscor @ Toxic Orb
Level: 79
Jolly Nature
Ability: Poison Heal
- Earthquake
- Dual Wingbeat
- Facade
- Swords Dance
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), Cloyster, Gilscor, new Field());
          const result = battleSimulator.getResult();
          expectTurn(
            result.turnOutcomes[0],
            { pokemon: Gilscor, move: 'Earthquake' },
            { pokemon: Cloyster, move: 'Icicle Spear' },
          )
          expect(result.winner.id).toBe(Cloyster.id);
      });

      xtest('Leader Tate - Latios vs. Musharna: Switch in and get KOd', () => {
        let [Musharna, Latios] = importTeam(`
Musharna
Level: 85
Naughty Nature
Ability: Synchronize
IVs: 3 HP / 24 Atk / 3 Def / 0 SpA / 26 SpD / 26 Spe
- Psychic
- Moonblast
- Psyshock
- Moonlight

Latios-Mega
Level: 85
Hasty Nature
Ability: Levitate
- Draco Meteor
- Zen Headbutt
- Earthquake
- Dragon Dance
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), Musharna, Latios, new Field());
          const result = battleSimulator.getResult({ playerSwitchingIn: true });
          expectTurn(
            result.turnOutcomes[0],
            { pokemon: Latios, move: 'Draco Meteor' },
          )
          expectTurn(
            result.turnOutcomes[1],
            { pokemon: Latios, move: 'Draco Meteor' },
          )
          expect(result.winner.id).toBe(Latios.id);
      });
    });

    xtest('Winstrate Vito Fallarbor - Safe KO Alakazam', () => {
        let [Alakazam, Excadrill] = importTeam(`
Alakazam @ Focus Sash
Level: 48
Timid Nature
Ability: Inner Focus
- Psychic
- Aura Sphere
- Shadow Ball
- Charge Beam

Excadrill
Level: 48
Naive Nature
Ability: Sand Force
IVs: 23 HP / 9 Atk / 5 Def / 0 SpA / 29 SpD / 10 Spe
- Drill Run
- Iron Head
- Rock Slide
- Rapid Spin
`);

          let battleSimulator = new BattleSimulator(Generations.get(gen), Excadrill, Alakazam, new Field());
          const result = battleSimulator.getResult();
          expectTurn(
            result.turnOutcomes[0],
            { pokemon: Alakazam, move: 'Aura Sphere' },
            { pokemon: Excadrill, move: 'Rapid Spin' },
          );
          expectTurn(
            result.turnOutcomes[1],
            { pokemon: Excadrill, move: 'Drill Run' },
          );
          expect(result.winner.id).toBe(Excadrill.id);
    });
  });

  function expectTurn(turn: TurnOutcome, firstMover: { pokemon: Pokemon, move: string }, secondMover?: { pokemon: Pokemon, move: string }) {
    let first = turn.actions[0];
    let second = turn.actions[1];
    expect(`Turn ${turn.turnNumber} action 1. ${first.attacker.name} - ${first.move.name}`).toBe(`Turn ${turn.turnNumber} action 1. ${firstMover.pokemon.name} - ${firstMover.move}`);
    if (secondMover) {
      expect(`Turn ${turn.turnNumber} action 2. ${second?.attacker.name} - ${second?.move.name}`).toBe(`Turn ${turn.turnNumber} action 2. ${secondMover.pokemon.name} - ${secondMover.move}`);
    }
    else {
      expect(turn.actions[1]).toBeUndefined()
    }
  }
});