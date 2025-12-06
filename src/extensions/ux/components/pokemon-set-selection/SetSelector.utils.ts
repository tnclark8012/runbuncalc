/**
 * Utility functions for SetSelector component
 */

import { CustomSets } from '../../../core/storage.contracts';

/**
 * Filters Pokemon sets by search term, matching against both species names and trainer names
 * @param availableSets - All available Pokemon sets
 * @param searchTerm - Search string to filter by (case-insensitive)
 * @returns Filtered sets matching the search term
 */
export function filterSetsBySearch(availableSets: CustomSets, searchTerm: string): CustomSets {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  if (!normalizedSearch) {
    return availableSets;
  }

  const filtered: CustomSets = {};
  
  Object.keys(availableSets).forEach((species) => {
    const speciesLower = species.toLowerCase();
    const sets = availableSets[species];
    
    // Check if species name matches
    if (speciesLower.includes(normalizedSearch)) {
      filtered[species] = sets;
      return;
    }
    
    // Check if any trainer name matches
    const matchingSets: typeof sets = {};
    Object.keys(sets).forEach((setName) => {
      if (setName.toLowerCase().includes(normalizedSearch)) {
        matchingSets[setName] = sets[setName];
      }
    });
    
    if (Object.keys(matchingSets).length > 0) {
      filtered[species] = matchingSets;
    }
  });
  
  return filtered;
}
