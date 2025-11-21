import { 
  getRecommendedMoves, 
  getLevelCapsWithMovesets, 
  hasRecommendedMovesets,
  LEVEL_CAP_CHECKPOINTS,
  RECOMMENDED_MOVESETS
} from './recommended-movesets';

describe('Recommended Movesets', () => {
  describe('LEVEL_CAP_CHECKPOINTS', () => {
    test('should contain all 23 level cap checkpoints', () => {
      expect(LEVEL_CAP_CHECKPOINTS).toHaveLength(23);
    });

    test('should have correct first checkpoint', () => {
      expect(LEVEL_CAP_CHECKPOINTS[0]).toEqual({
        name: 'Route 104 Aqua Grunt',
        level: 12
      });
    });

    test('should have correct last checkpoint', () => {
      expect(LEVEL_CAP_CHECKPOINTS[22]).toEqual({
        name: 'Champion Wallace',
        level: 99
      });
    });

    test('should have levels in ascending order', () => {
      for (let i = 1; i < LEVEL_CAP_CHECKPOINTS.length; i++) {
        expect(LEVEL_CAP_CHECKPOINTS[i].level).toBeGreaterThan(
          LEVEL_CAP_CHECKPOINTS[i - 1].level
        );
      }
    });
  });

  describe('getRecommendedMoves', () => {
    test('should return moves for Piplup at Route 104 Aqua Grunt', () => {
      const moves = getRecommendedMoves('Piplup', 'Route 104 Aqua Grunt');
      expect(moves).toBeDefined();
      expect(moves).toEqual(['Pluck', 'Pound', 'Bubble', 'Growl']);
    });

    test('should return undefined for non-existent Pokémon', () => {
      const moves = getRecommendedMoves('NonExistentPokemon', 'Route 104 Aqua Grunt');
      expect(moves).toBeUndefined();
    });

    test('should return undefined for Pokémon without moveset at specific level cap', () => {
      const moves = getRecommendedMoves('Piplup', 'Leader Brawly');
      expect(moves).toBeUndefined();
    });

    test('should return array of strings', () => {
      const moves = getRecommendedMoves('Piplup', 'Route 104 Aqua Grunt');
      expect(moves).toBeDefined();
      expect(Array.isArray(moves)).toBe(true);
      if (moves) {
        moves.forEach(move => {
          expect(typeof move).toBe('string');
        });
      }
    });
  });

  describe('getLevelCapsWithMovesets', () => {
    test('should return all level caps for Piplup', () => {
      const levelCaps = getLevelCapsWithMovesets('Piplup');
      expect(levelCaps).toContain('Route 104 Aqua Grunt');
    });

    test('should return empty array for non-existent Pokémon', () => {
      const levelCaps = getLevelCapsWithMovesets('NonExistentPokemon');
      expect(levelCaps).toEqual([]);
    });

    test('should return all defined level caps for Piplup', () => {
      const levelCaps = getLevelCapsWithMovesets('Piplup');
      const expectedLevelCaps = Object.keys(RECOMMENDED_MOVESETS['Piplup']);
      expect(levelCaps).toEqual(expectedLevelCaps);
    });
  });

  describe('hasRecommendedMovesets', () => {
    test('should return true for Piplup', () => {
      expect(hasRecommendedMovesets('Piplup')).toBe(true);
    });

    test('should return false for non-existent Pokémon', () => {
      expect(hasRecommendedMovesets('NonExistentPokemon')).toBe(false);
    });
  });

  describe('RECOMMENDED_MOVESETS structure', () => {
    test('should have consistent structure', () => {
      Object.entries(RECOMMENDED_MOVESETS).forEach(([pokemonName, movesets]) => {
        expect(typeof pokemonName).toBe('string');
        expect(typeof movesets).toBe('object');
        
        Object.entries(movesets).forEach(([levelCapName, moveset]) => {
          expect(typeof levelCapName).toBe('string');
          expect(typeof moveset).toBe('object');
          expect(Array.isArray(moveset.moves)).toBe(true);
          if (moveset.moves) {
            moveset.moves.forEach(move => {
              expect(typeof move).toBe('string');
            });
          }
        });
      });
    });

    test('should have valid level cap names', () => {
      const validLevelCapNames = LEVEL_CAP_CHECKPOINTS.map(cp => cp.name);
      
      Object.values(RECOMMENDED_MOVESETS).forEach(movesets => {
        Object.keys(movesets).forEach(levelCapName => {
          expect(validLevelCapNames).toContain(levelCapName);
        });
      });
    });
  });
});
