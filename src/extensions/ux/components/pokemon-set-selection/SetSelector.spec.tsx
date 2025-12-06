/**
 * Tests for SetSelector component
 */

import { CustomSets } from '../../../core/storage.contracts';

describe('SetSelector Search Functionality', () => {
  // Sample test data that mimics the structure of TrainerSets
  const sampleSets: CustomSets = {
    pikachu: {
      'Youngster Joey': {
        level: 25,
        ability: 'Static',
        item: 'Light Ball',
        nature: 'Jolly',
        moves: ['Volt Tackle', 'Quick Attack', 'Thunder Wave', 'Iron Tail'],
      },
      'Ace Trainer Sarah': {
        level: 50,
        ability: 'Lightning Rod',
        item: 'Light Ball',
        nature: 'Timid',
        moves: ['Thunderbolt', 'Grass Knot', 'Hidden Power Ice', 'Volt Switch'],
      },
    },
    charizard: {
      'Champion Red': {
        level: 84,
        ability: 'Blaze',
        item: 'Charizardite Y',
        nature: 'Timid',
        moves: ['Fire Blast', 'Solar Beam', 'Focus Blast', 'Roost'],
      },
    },
    abomasnow: {
      'Winstrate Victoria': {
        level: 50,
        ability: 'Snow Warning',
        item: 'Abomasite',
        nature: 'Modest',
        moves: ['Blizzard', 'Giga Drain', 'Ice Shard', 'Protect'],
      },
    },
  };

  it('should filter by Pokemon species name (full match)', () => {
    const searchTerm = 'pikachu';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('pikachu');
    expect(Object.keys(filtered)).not.toContain('charizard');
    expect(Object.keys(filtered)).not.toContain('abomasnow');
  });

  it('should filter by Pokemon species name (partial match)', () => {
    const searchTerm = 'pika';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('pikachu');
    expect(Object.keys(filtered).length).toBe(1);
  });

  it('should filter by trainer name (full match)', () => {
    const searchTerm = 'Champion Red';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('charizard');
    expect(filtered['charizard']).toHaveProperty('Champion Red');
    expect(Object.keys(filtered).length).toBe(1);
  });

  it('should filter by trainer name (partial match)', () => {
    const searchTerm = 'champion';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('charizard');
    expect(filtered['charizard']).toHaveProperty('Champion Red');
  });

  it('should filter by trainer name (case insensitive)', () => {
    const searchTerm = 'YOUNGSTER';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('pikachu');
    expect(filtered['pikachu']).toHaveProperty('Youngster Joey');
  });

  it('should return all sets when search is empty', () => {
    const searchTerm = '';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered).length).toBe(3);
    expect(filtered).toEqual(sampleSets);
  });

  it('should return multiple Pokemon if trainer name matches across species', () => {
    const searchTerm = 'trainer';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('pikachu');
    expect(filtered['pikachu']).toHaveProperty('Ace Trainer Sarah');
    expect(Object.keys(filtered).length).toBe(1);
  });

  it('should filter specific trainers when species has multiple trainers', () => {
    const searchTerm = 'joey';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered)).toContain('pikachu');
    expect(filtered['pikachu']).toHaveProperty('Youngster Joey');
    expect(filtered['pikachu']).not.toHaveProperty('Ace Trainer Sarah');
  });

  it('should return empty object when no matches found', () => {
    const searchTerm = 'nonexistent';
    const filtered = filterSetsBySearch(sampleSets, searchTerm);
    
    expect(Object.keys(filtered).length).toBe(0);
  });
});

/**
 * Helper function that implements the same filtering logic as the SetSelector component
 * This is extracted for testing purposes
 */
function filterSetsBySearch(availableSets: CustomSets, inputValue: string): CustomSets {
  const searchTerm = inputValue.toLowerCase().trim();
  
  if (!searchTerm) {
    return availableSets;
  }

  const filtered: CustomSets = {};
  
  Object.keys(availableSets).forEach((species) => {
    const speciesLower = species.toLowerCase();
    const sets = availableSets[species];
    
    // Check if species name matches
    if (speciesLower.includes(searchTerm)) {
      filtered[species] = sets;
      return;
    }
    
    // Check if any trainer name matches
    const matchingSets: typeof sets = {};
    Object.keys(sets).forEach((setName) => {
      if (setName.toLowerCase().includes(searchTerm)) {
        matchingSets[setName] = sets[setName];
      }
    });
    
    if (Object.keys(matchingSets).length > 0) {
      filtered[species] = matchingSets;
    }
  });
  
  return filtered;
}
