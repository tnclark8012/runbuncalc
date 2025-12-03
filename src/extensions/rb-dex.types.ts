export interface BattleLearnsets {
  [speciesid: string]: SpeciesLearnset;
}

export interface SpeciesLearnset {
  learnset: {
    [moveid: string]: string[];
  };
}

export interface Dex {
  moves: { get: (id: string) => any | undefined };
  species: { get: (id: string) => any | undefined };
}