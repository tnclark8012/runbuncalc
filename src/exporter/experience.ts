import { readSpeciesInfo } from './rom-reader';
import { GameConfig } from './types';

// Growth rate IDs (from pokeemerald-expansion)
const GROWTH_MEDIUM_FAST = 0;
const GROWTH_ERRATIC = 1;
const GROWTH_FLUCTUATING = 2;
const GROWTH_MEDIUM_SLOW = 3;
const GROWTH_FAST = 4;
const GROWTH_SLOW = 5;

function mediumFastCurve(n: number): number {
  return Math.floor(n ** 3);
}

function erraticCurve(n: number): number {
  if (n <= 50) return Math.floor(((100 - n) * n ** 3) / 50);
  if (n <= 68) return Math.floor(((150 - n) * n ** 3) / 100);
  if (n <= 98) return Math.floor(Math.floor((1911 - 10 * n) / 3) * n ** 3 / 500);
  return Math.floor((160 - n) * n ** 3 / 100);
}

function fluctuatingCurve(n: number): number {
  if (n < 15) return Math.floor((Math.floor((n + 1) / 3) + 24) * n ** 3 / 50);
  if (n <= 36) return Math.floor((n + 14) * n ** 3 / 50);
  return Math.floor((Math.floor(n / 2) + 32) * n ** 3 / 50);
}

function mediumSlowCurve(n: number): number {
  return Math.floor((6 * n ** 3) / 5) - 15 * n ** 2 + 100 * n - 140;
}

function fastCurve(n: number): number {
  return Math.floor((4 * n ** 3) / 5);
}

function slowCurve(n: number): number {
  return Math.floor((5 * n ** 3) / 4);
}

function expRequired(growthRate: number, level: number): number {
  switch (growthRate) {
  case GROWTH_MEDIUM_FAST: return mediumFastCurve(level);
  case GROWTH_ERRATIC: return erraticCurve(level);
  case GROWTH_FLUCTUATING: return fluctuatingCurve(level);
  case GROWTH_MEDIUM_SLOW: return mediumSlowCurve(level);
  case GROWTH_FAST: return fastCurve(level);
  case GROWTH_SLOW: return slowCurve(level);
  default: return mediumFastCurve(level);
  }
}

export function calcLevel(experience: number, growthRate: number): number {
  let level = 1;
  while (level < 100 && experience >= expRequired(growthRate, level + 1)) {
    level++;
  }
  return level;
}

export function calcLevelFromRom(experience: number, speciesId: number, config: GameConfig, romBuffer: ArrayBuffer): number {
  const info = readSpeciesInfo(config, romBuffer, speciesId);
  return calcLevel(experience, info.growthRate);
}
