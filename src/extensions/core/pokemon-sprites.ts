import {spriteIds} from '@runbuncalc/rbdex-data';

export function getPokemonSpriteUrl(species: string): string | undefined {
  const id = species.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const spriteId = spriteIds[id];
  return spriteId ? `./pokemon-sprites/${spriteId}.png` : undefined;
}
