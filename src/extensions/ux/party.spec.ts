import { parsePokemonId } from './party';

describe('parsePokemonId', () => {
  it('preserves parentheses in imported nicknames', () => {
    expect(parsePokemonId('Bulbasaur (Leaf (1))')).toEqual({ species: 'Bulbasaur', setName: 'Leaf (1)' });
    expect(parsePokemonId('Mr. Mime (Mimi)')).toEqual({ species: 'Mr. Mime', setName: 'Mimi' });
  });
});
