import { Move, StatsTable } from '@smogon/calc';
import { importPokemon, importTeam } from '@smogon/calc/src/test/helper';

describe('BattleFieldState', () => {
  describe('Pokemon', () => {
    test('Pokemon.clone()', () => {
      const original = importPokemon(`
Krabby @ Focus Sash
Level: 1
Hardy Nature
Ability: Hyper Cutter
IVs: 3 Atk
- Aqua Jet
- Crabhammer
`);
      let clone1 = original.clone();
      original.boosts.atk = 1;
      expect(clone1.boosts.atk).toBe(0);

      clone1.boosts.atk = 2;
      expect(original.boosts.atk).toBe(1);
    });
  });
});