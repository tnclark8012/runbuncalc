import { expectCpuTeam, importTeam } from './test-helper';
import { applyTransforms, BattleFieldStateTransform } from './turn-state';
import { applyCpuSwitchIns, applyPlayerSwitchIns } from './phases/switching';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition, Trainer } from './moveScoring.contracts';
import { Field } from '@smogon/calc';

describe('Turn state', () => {
  test('Switch ins - Sis And Bro Reli And Ian', () => {
    const transforms: BattleFieldStateTransform[] = [
            applyPlayerSwitchIns,
            applyCpuSwitchIns,
        ];
  
    let [Victreebel, Aerodactyl, Cinderace, Mimikyu, Ursaluna, Sharpedo] = importTeam(`
Victreebel @ Focus Sash
Level: 90
Lonely Nature
Ability: Chlorophyll
- Solar Blade
- Gunk Shot
- Weather Ball
- Sleep Powder

Aerodactyl @ Rock Gem
Level: 90
Adamant Nature
Ability: Unnerve
- Stone Edge
- Dual Wingbeat
- Stealth Rock
- Protect

Cinderace @ Iapapa Berry
Level: 90
Jolly Nature
Ability: Libero
- Pyro Ball
- Low Sweep
- Coaching
- Super Fang

Mimikyu @ Fairy Gem
Level: 89
Jolly Nature
Ability: Disguise
- Play Rough
- Shadow Claw
- Shadow Sneak
- Swords Dance

Ursaluna @ Assault Vest
Level: 89
Sassy Nature
Ability: Unnerve
- High Horsepower
- Stone Edge
- Payback
- Return

Sharpedo @ Life Orb
Level: 91
Jolly Nature
Ability: Speed Boost
- Crunch
- Close Combat
- Psychic Fangs
- Protect
    `);
    
    let [Excadrill, Aggron, Carracosta] = importTeam(`
Excadrill @ Assault Vest
Level: 91
Naive Nature
Ability: Sand Force
IVs: 23 HP / 9 Atk / 5 Def / 0 SpA / 29 SpD / 10 Spe
- Earthquake
- Iron Head
- High Horsepower
- Rapid Spin

Aggron @ Wide Lens
Level: 91
Hardy Nature
Ability: Rock Head
IVs: 29 HP / 24 Atk / 18 Def / 3 SpA / 24 SpD / 23 Spe
- Earthquake
- Rock Tomb
- Head Smash
- Heavy Slam

Carracosta
Level: 75
Naughty Nature
Ability: Solid Rock
IVs: 30 HP / 9 Atk / 21 Def / 6 SpA / 14 SpD / 25 Spe
- Rock Slide
- Knock Off
- Aqua Jet
- Protect
`);

      // Scenario: Break focus sash with Excadrill and protect with Carracosta. KO Aerodactyl with Iron Head, then switch to Aggron.

      Aerodactyl = Aerodactyl.clone({ curHP: 0 });
      Victreebel = Victreebel.clone({ curHP: 208 });
      Victreebel.item = undefined;

      Excadrill = Excadrill.clone({ boosts: { spe: 1 } });
      Aggron = Aggron.clone({ curHP: 152 }); // high roll solar blade in sun

      let sun = new Field({ gameType: 'Doubles', weather: 'Sun' });
      let state = new BattleFieldState(
        new PlayerTrainer([ new PokemonPosition(Excadrill, false), new PokemonPosition(Aggron, true) ], [Carracosta]),
        new CpuTrainer([ new PokemonPosition(Victreebel, false), new PokemonPosition(Aerodactyl, false) ], [Cinderace, Mimikyu, Ursaluna, Sharpedo]),
        sun
      );
      const newStates = applyTransforms(state, transforms);
      expect(newStates.length).toBe(1);
      // Cinderace comes out because it fast KO's Aggron, but doesn't see that it gets fast KO'd by Excadrill
      expectCpuTeam([{ pokemon: Victreebel, firstTurnOut: false }, { pokemon: Cinderace, firstTurnOut: true }], [Mimikyu, Ursaluna, Sharpedo, Aerodactyl], newStates[0].state);
  });
});