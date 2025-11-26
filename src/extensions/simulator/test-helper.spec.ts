import { StatsTable } from '@smogon/calc';
import { importPokemon, importTeam } from '@smogon/calc/src/test/helper';

describe('Helper', () => {
  test('importPokemon', () => {
    let pokemon = importPokemon(`
Krabby @ Focus Sash
Level: 1
Hardy Nature
Ability: Hyper Cutter
IVs: 3 Atk
- Aqua Jet
- Crabhammer
`);
    let krabby = pokemon;
    expect(krabby.name).toBe('Krabby');
    expect(krabby.item).toBe('Focus Sash');
    expect(krabby.moves).toEqual(['Aqua Jet', 'Crabhammer']);
    expect(krabby.ivs).toEqual(<StatsTable>{
        atk: 3,
        def: 31,
        hp: 31,
        spa: 31,
        spd: 31,
        spe: 31
    });
    expect(krabby.ability).toBe('Hyper Cutter');
  });

  test('importTeam', () => {
    let [krabby, ape] = importTeam(`
      Krabby
      Level: 100
      - Swords Dance
      
      Infernape
      Level: 5
      - Close Combat
      `);
      expect(krabby.level).toBe(100);
      expect(ape.level).toBe(5);

  });

  test('Full sets', () => {
    let tirtougaDef = `
Tirtouga
Level: 21
Hardy Nature
Ability: Solid Rock
IVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe
- Smack Down
- Brine
- Aqua Jet
- Bite`;

let combuskenDef = `
Combusken @ Lum Berry
Level: 20
Naughty Nature
Ability: Speed Boost
- Double Kick
- Incinerate
- Thunder Punch
- Work Up`;
    let tirtouga = importPokemon(tirtougaDef);
    let combusken = importPokemon(combuskenDef);

    expect(combusken.ability).toBe('Speed Boost');

    [tirtouga, combusken] = importTeam(`${tirtougaDef}
      ${combuskenDef}`);

    expect(combusken.ability).toBe('Speed Boost');

    [tirtouga, combusken] = importTeam(`
Tirtouga
Level: 21
Hardy Nature
Ability: Solid Rock
IVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe
- Smack Down
- Brine
- Aqua Jet
- Bite

Combusken @ Lum Berry
Level: 20
Naughty Nature
Ability: Speed Boost
- Double Kick
- Incinerate
- Thunder Punch
- Work Up
`);

    expect(combusken.ability).toBe('Speed Boost');
  })
});
