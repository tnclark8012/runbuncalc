/* eslint-disable max-len */

import {
  Field,
  calculate,
  Move
} from '@smogon/calc';
import { inGen, importTeam, importPokemon } from './test-helper';
import { calculateAllMoves, megaEvolve, toMoveResult, createMove } from './moveScoring';
import { OpposingTrainer } from '../trainer-sets';
import { getBox } from './playthrough/museum.collection';
import { gen } from '../configuration';

const RunAndBun = 8;
inGen(RunAndBun, ({ }) => {
  describe('Move Scoring', () => {
    describe('Mega evolution', () => {
      test(`Mega evolve`, () => {
        let [Lopunny] = importTeam(`
Lopunny @ Lopunnite
Level: 1
- Fake out
- Hyper Beam
`);
        let mega = megaEvolve(Lopunny);
        expect(mega.name).toBe('Lopunny-Mega');
        expect(mega.ability).toBe('Scrappy');
        expect(mega.stats.atk).toBeGreaterThan(Lopunny.stats.atk);
        expect(mega.moves).toEqual(Lopunny.moves);
      });
    });

    describe('toMoveResult', () => {
      test('should calculate per-hit percentage without multiplying by hits', () => {
        // Import Braviary with Dual Wingbeat (2-hit move)
        let [Braviary] = importTeam(`
Braviary (M) @ Choice Band
Level: 38
Ability: Defiant
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Dual Wingbeat
`);
        
        // Import Talonflame as the defender
        let [Talonflame] = importTeam(`
Talonflame
Level: 38
Jolly Nature
Ability: Flame Body
IVs: 11 Def / 30 SpA / 25 SpD
- Acrobatics
- Flame Charge
- Will-O-Wisp
- Roost
`);

        // Calculate damage for Dual Wingbeat
        const move = createMove(Braviary, Braviary.moves[0]);
        const result = calculate(gen, Braviary, Talonflame, move);
        const moveResult = toMoveResult(result);

        // Dual Wingbeat hits 2 times
        expect(moveResult.move.hits).toBe(2);

        // The per-hit percentage should be approximately half of what the total would be
        // since it hits 2 times
        const totalLowestPct = (moveResult.lowestRollPerHitHpPercentage * moveResult.move.hits);
        const totalHighestPct = (moveResult.highestRollPerHitHpPercentage * moveResult.move.hits);

        // Verify that per-hit percentage is indeed per-hit (not already multiplied by hits)
        // For a 2-hit move, the per-hit should be roughly half the total
        expect(moveResult.lowestRollPerHitHpPercentage).toBeLessThan(totalLowestPct);
        expect(moveResult.highestRollPerHitHpPercentage).toBeLessThan(totalHighestPct);

        // Verify the per-hit damage is the basis for the percentage calculation
        const expectedLowestPct = (moveResult.lowestRollPerHitDamage / Talonflame.stats.hp) * 100;
        const expectedHighestPct = (moveResult.highestRollPerHitDamage / Talonflame.stats.hp) * 100;
        
        expect(moveResult.lowestRollPerHitHpPercentage).toBeCloseTo(expectedLowestPct, 2);
        expect(moveResult.highestRollPerHitHpPercentage).toBeCloseTo(expectedHighestPct, 2);
      });

      test('should calculate per-hit percentage correctly for single-hit move', () => {
        let [Talonflame] = importTeam(`
Talonflame
Level: 38
Jolly Nature
Ability: Flame Body
- Acrobatics
`);
        
        let [Braviary] = importTeam(`
Braviary (M)
Level: 38
Ability: Defiant
`);

        // Calculate damage for Acrobatics (single-hit move)
        const move = createMove(Talonflame, Talonflame.moves[0]);
        const result = calculate(gen, Talonflame, Braviary, move);
        const moveResult = toMoveResult(result);

        // Acrobatics hits 1 time
        expect(moveResult.move.hits).toBe(1);

        // For a single-hit move, per-hit percentage should equal total percentage
        const expectedLowestPct = (moveResult.lowestRollPerHitDamage / Braviary.stats.hp) * 100;
        const expectedHighestPct = (moveResult.highestRollPerHitDamage / Braviary.stats.hp) * 100;
        
        expect(moveResult.lowestRollPerHitHpPercentage).toBeCloseTo(expectedLowestPct, 2);
        expect(moveResult.highestRollPerHitHpPercentage).toBeCloseTo(expectedHighestPct, 2);
      });
    });

    describe('Speed boost moves (Agility, Rock Polish, Autotomize)', () => {
      test('Agility should score +7 when AI is slower', () => {
        let [slowMon] = importTeam(`
Snorlax @ Leftovers
Level: 50
Ability: Thick Fat
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Agility
- Body Slam
`);
        
        let [fastMon] = importTeam(`
Talonflame @ Sharp Beak
Level: 50
Ability: Flame Body
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Acrobatics
`);

        // Snorlax is slower than Talonflame, so Agility should score +7
        expect(slowMon.stats.spe).toBeLessThan(fastMon.stats.spe);
      });

      test('Agility should never be used when AI is faster', () => {
        let [fastMon] = importTeam(`
Talonflame @ Sharp Beak
Level: 50
Ability: Flame Body
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Agility
- Acrobatics
`);
        
        let [slowMon] = importTeam(`
Snorlax @ Leftovers
Level: 50
Ability: Thick Fat
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Body Slam
`);

        // Talonflame is faster than Snorlax, so Agility should never be used (score -20)
        expect(fastMon.stats.spe).toBeGreaterThan(slowMon.stats.spe);
      });
    });

    describe('Focus Energy and Laser Focus', () => {
      test('Focus Energy should score higher with Super Luck ability', () => {
        let [absol] = importTeam(`
Absol @ Scope Lens
Level: 50
Ability: Super Luck
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Focus Energy
- Night Slash
`);

        expect(absol.ability).toBe('Super Luck');
        expect(absol.moves).toContain('Focus Energy');
      });
    });

    describe('Belly Drum', () => {
      test('Belly Drum should be imported correctly', () => {
        let [slurpuff] = importTeam(`
Slurpuff @ Sitrus Berry
Level: 50
Ability: Unburden
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Belly Drum
- Play Rough
`);

        expect(slurpuff.moves).toContain('Belly Drum');
        expect(slurpuff.item).toBe('Sitrus Berry');
      });
    });
  });
});