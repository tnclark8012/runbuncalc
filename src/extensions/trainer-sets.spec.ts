import { getTrainerNameByPokemonIndex, getTrainerNameByTrainerIndex, OpposingTrainer } from "./trainer-sets";
import { TrainerSets } from "./trainer-sets.data";

describe('Trainer Sets', () => {
  it('getTrainerNameByTrainerIndex', () => {
    let index = 0;
    expect(getTrainerNameByTrainerIndex(index)).toBe('Youngster Calvin');
    expect(getTrainerNameByTrainerIndex(++index)).toBe('Bug Catcher Rick');
  });

  it('getTrainerNameBySetSelection', () => {
    let index = TrainerSets['Aerodactyl']['Sis And Bro Reli And Ian'].index;
    expect(getTrainerNameByPokemonIndex(index)).toBe('Sis And Bro Reli And Ian');
  });

  it('getTrainerNameBySetSelection', () => {
    const party = OpposingTrainer('Fisherman Darian');
    expect(party.length).toBe(2);
    expect(party.map(p => p.species.name)).toEqual(['Magikarp', 'Magikarp']);
  });
})