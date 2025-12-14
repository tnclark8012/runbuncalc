import { ConfiguredHeuristics, Heuristics } from "../configuration";

export function usingHeuristics<T>(chosenHeuristics: Partial<ConfiguredHeuristics>, fn: () => T): T {
  const originalHeuristics = { ...Heuristics };
  try {
    for (const key in chosenHeuristics) {
      (Heuristics as any)[key] = (chosenHeuristics as any)[key];
    }
    return fn();
  } finally {
    for (const key in originalHeuristics) {
      (Heuristics as any)[key] = (originalHeuristics as any)[key];
    }
  }
}