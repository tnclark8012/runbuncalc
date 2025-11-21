/**
 * Recommended movesets for Pokémon by level cap checkpoint
 * This file contains the mapping of recommended moves for each Pokémon at different level caps
 */

import { CustomSets, PokemonSet } from './core/storage.contracts';

export interface LevelCapCheckpoint {
  name: string;
  level: number;
}

/**
 * Level cap checkpoints in the game
 * Each checkpoint represents a major milestone with a specific level cap
 */
export const LEVEL_CAP_CHECKPOINTS: LevelCapCheckpoint[] = [
  { name: 'Route 104 Aqua Grunt', level: 12 },
  { name: 'Museum Aqua Grunts', level: 17 },
  { name: 'Leader Brawly', level: 21 },
  { name: 'Leader Roxanne', level: 25 },
  { name: 'Route 117 Chelle', level: 32 },
  { name: 'Leader Wattson', level: 35 },
  { name: 'Cycling Road Rival', level: 38 },
  { name: 'Leader Norman', level: 42 },
  { name: 'Fallarbor Town Vito', level: 48 },
  { name: 'Mt. Chimney Maxie', level: 54 },
  { name: 'Leader Flannery', level: 57 },
  { name: 'Weather Institute Shelly', level: 65 },
  { name: 'Route 119 Rival', level: 66 },
  { name: 'Leader Winona', level: 69 },
  { name: 'Lilycove City Rival', level: 73 },
  { name: 'Mt. Pyre Archie', level: 76 },
  { name: 'Magma Hideout Maxie', level: 79 },
  { name: 'Aqua Hideout Matt', level: 81 },
  { name: 'Leaders Tate & Liza', level: 85 },
  { name: 'Seafloor Cavern Archie', level: 89 },
  { name: 'Leader Juan', level: 91 },
  { name: 'Victory Road Vito', level: 95 },
  { name: 'Champion Wallace', level: 99 }
];

/**
 * Recommended movesets for each Pokémon at different level caps
 * Uses the CustomSets interface where set name is the level cap name
 * 
 * Note: Move names are strings to maintain consistency with the rest of the codebase.
 * Users can expand this mapping with additional Pokémon and their recommended movesets.
 */
export const RECOMMENDED_MOVESETS: CustomSets = {
  // Initial recommended set
  'Piplup': {
    'Route 104 Aqua Grunt': {
      moves: ['Pluck', 'Pound', 'Bubble', 'Growl']
    }
  }
};

/**
 * Get recommended moves for a Pokémon at a specific level cap
 * @param pokemonName - The name of the Pokémon
 * @param levelCapName - The name of the level cap checkpoint
 * @returns Array of recommended move names, or undefined if no recommendation exists
 */
export function getRecommendedMoves(pokemonName: string, levelCapName: string): string[] | undefined {
  const pokemonMovesets = RECOMMENDED_MOVESETS[pokemonName];
  if (!pokemonMovesets) {
    return undefined;
  }
  const moveset = pokemonMovesets[levelCapName];
  return moveset?.moves;
}

/**
 * Get all level cap names for which a Pokémon has recommended movesets
 * @param pokemonName - The name of the Pokémon
 * @returns Array of level cap names where movesets are defined for this Pokémon
 */
export function getLevelCapsWithMovesets(pokemonName: string): string[] {
  const pokemonMovesets = RECOMMENDED_MOVESETS[pokemonName];
  if (!pokemonMovesets) {
    return [];
  }
  return Object.keys(pokemonMovesets);
}

/**
 * Check if a Pokémon has any recommended movesets defined
 * @param pokemonName - The name of the Pokémon
 * @returns true if the Pokémon has at least one moveset defined
 */
export function hasRecommendedMovesets(pokemonName: string): boolean {
  return pokemonName in RECOMMENDED_MOVESETS;
}
