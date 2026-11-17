import { Pokemon } from '@smogon/calc';
import { gen } from '../configuration';
import { getAbilitiesForPokemon, Pokedex } from './pokedex';

describe('bundled Run & Bun pokedex', () => {
  it('looks up abilities without browser globals or remote scripts', async () => {
    await expect(getAbilitiesForPokemon(new Pokemon(gen, 'Aegislash-Blade')))
      .resolves.toEqual(['Stance Change']);
  });

  it('includes pre-evolution moves, sorted and deduplicated', async () => {
    const entry = await Pokedex.getEntry(new Pokemon(gen, 'Venusaur'));
    expect(entry?.moves).toContain('Vine Whip');
    expect(entry?.moves).toEqual([...new Set(entry?.moves)].sort());
  });

  it('does not let callers modify the shared bundled data', async () => {
    const pokemon = new Pokemon(gen, 'Bulbasaur');
    const entry = (await Pokedex.getEntry(pokemon))!;
    entry.abilities.length = 0;
    entry.moves.length = 0;
    const nextEntry = (await Pokedex.getEntry(pokemon))!;
    expect(nextEntry.abilities).toContain('Overgrow');
    expect(nextEntry.moves).toContain('Vine Whip');
  });
});
