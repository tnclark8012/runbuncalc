import { Field, Pokemon, Side } from "@smogon/calc";

describe('@smogon/calc patch', () => {
  describe('Pokemon', () => {
    it('Pokemon.id', () => {
      const pokemon = new Pokemon(8, 'Pikachu');
      expect(pokemon.id).toBeDefined();

      const copy = pokemon.clone();
      expect(copy.id).toBe(pokemon.id);
    });

    it('Pokemon.curHP', () => {
      const pokemon = new Pokemon(8, 'Pikachu', { curHP: 2 });
      expect(pokemon.curHP()).toBe(2);

      let copy = pokemon.clone();
      expect(copy.curHP()).toBe(2);
      copy = pokemon.clone({ curHP: 1 });
      expect(copy.curHP()).toBe(1);
    });
  });

  describe('Field', () => {
    it('trickRoom and stickyWeb', () => {
      const field = new Field({ gameType: 'Singles', isTrickRoom: true });
      expect(field.isTrickRoom).toBe(true);

      const copy = field.clone();
      expect(copy.isTrickRoom).toBe(true);
    });
  });

  describe('Side', () => {
    it('isStickyWebs', () => {
      const side = new Side({ isStickyWebs: true });
      expect(side.isStickyWebs).toBe(true);

      const copy = side.clone();
      expect(copy.isStickyWebs).toBe(true);
    });
  });
});