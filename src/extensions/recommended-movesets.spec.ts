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
    test('should return moves for Blaziken at Leader Brawly', () => {
      const moves = getRecommendedMoves('Blaziken', 'Leader Brawly');
      expect(moves).toBeDefined();
      expect(moves).toEqual(['Ember', 'Double Kick', 'Peck']);
    });

    test('should return moves for Swampert at Leader Norman', () => {
      const moves = getRecommendedMoves('Swampert', 'Leader Norman');
      expect(moves).toBeDefined();
      expect(moves).toEqual(['Surf', 'Earthquake', 'Ice Beam', 'Rock Slide']);
    });

    test('should return undefined for non-existent Pokémon', () => {
      const moves = getRecommendedMoves('NonExistentPokemon', 'Leader Brawly');
      expect(moves).toBeUndefined();
    });

    test('should return undefined for Pokémon without moveset at specific level cap', () => {
      const moves = getRecommendedMoves('Blaziken', 'Museum Aqua Grunts');
      expect(moves).toBeUndefined();
    });

    test('should return array of strings', () => {
      const moves = getRecommendedMoves('Blaziken', 'Leader Roxanne');
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
    test('should return all level caps for Blaziken', () => {
      const levelCaps = getLevelCapsWithMovesets('Blaziken');
      expect(levelCaps).toContain('Leader Brawly');
      expect(levelCaps).toContain('Leader Roxanne');
      expect(levelCaps).toContain('Champion Wallace');
    });

    test('should return empty array for non-existent Pokémon', () => {
      const levelCaps = getLevelCapsWithMovesets('NonExistentPokemon');
      expect(levelCaps).toEqual([]);
    });

    test('should return all defined level caps for Swampert', () => {
      const levelCaps = getLevelCapsWithMovesets('Swampert');
      const expectedLevelCaps = Object.keys(RECOMMENDED_MOVESETS['Swampert']);
      expect(levelCaps).toEqual(expectedLevelCaps);
    });
  });

  describe('hasRecommendedMovesets', () => {
    test('should return true for Blaziken', () => {
      expect(hasRecommendedMovesets('Blaziken')).toBe(true);
    });

    test('should return true for Swampert', () => {
      expect(hasRecommendedMovesets('Swampert')).toBe(true);
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
        
        Object.entries(movesets).forEach(([levelCapName, moves]) => {
          expect(typeof levelCapName).toBe('string');
          expect(Array.isArray(moves)).toBe(true);
          moves.forEach(move => {
            expect(typeof move).toBe('string');
          });
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
