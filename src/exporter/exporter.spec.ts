import * as fs from 'fs';
import * as path from 'path';
import { calcLevelFromRom } from './experience';
import { ABILITIES, SPECIES_NAMES } from './lookup-tables';
import { extractPokemon } from './pokemon-data';
import { getAbilityId } from './rom-reader';
import { parseSaveFile } from './save-parser';
import { formatAllPokemon, formatPartyMon, formatPCMon } from './showdown-format';

const TEST_DATA_DIR = path.join(__dirname, '__testdata__');
const SAV_PATH = path.join(TEST_DATA_DIR, 'Pokemon Null.sav');
const ROM_PATH = path.join(TEST_DATA_DIR, 'Pokemon Null.gba');

function loadTestFiles() {
  const savBuffer = fs.readFileSync(SAV_PATH).buffer;
  const romBuffer = fs.readFileSync(ROM_PATH).buffer;
  return {savBuffer, romBuffer};
}

describe('Save File Parser', () => {
  let savBuffer: ArrayBuffer;

  beforeAll(() => {
    savBuffer = loadTestFiles().savBuffer;
  });

  test('parses save file without errors', () => {
    const blocks = parseSaveFile(savBuffer);
    expect(blocks.saveBlock1).toBeDefined();
    expect(blocks.saveBlock2).toBeDefined();
    expect(blocks.pokemonStorage).toBeDefined();
  });

  test('rejects wrong-sized files', () => {
    expect(() => parseSaveFile(new ArrayBuffer(100))).toThrow('Expected 128KB');
  });
});

describe('Pokemon Data Extraction', () => {
  let savBuffer: ArrayBuffer;
  let romBuffer: ArrayBuffer;

  beforeAll(() => {
    ({savBuffer, romBuffer} = loadTestFiles());
  });

  test('extracts party pokemon', () => {
    const blocks = parseSaveFile(savBuffer);
    const {partyCount, party} = extractPokemon(blocks);
    expect(partyCount).toBe(6);
    expect(party.length).toBe(6);
  });

  test('party lead is Lv38 Lapras named Nessie', () => {
    const blocks = parseSaveFile(savBuffer);
    const {party} = extractPokemon(blocks);
    const lapras = party[0];

    expect(lapras.species).toBe(131);
    expect(SPECIES_NAMES[lapras.species - 1]).toBe('Lapras');
    expect(lapras.nickname).toBe('Nessie');
    expect(lapras.level).toBe(38);
  });

  test('Lapras IVs are correct', () => {
    const blocks = parseSaveFile(savBuffer);
    const {party} = extractPokemon(blocks);
    const lapras = party[0];

    expect(lapras.hpIV).toBe(31);
    expect(lapras.attackIV).toBe(31);
    expect(lapras.defenseIV).toBe(0);
    expect(lapras.spAttackIV).toBe(12);
    expect(lapras.spDefenseIV).toBe(30);
    expect(lapras.speedIV).toBe(13);
  });

  test('first PC box mon is Lv38 Darmanitan named Monke', () => {
    const blocks = parseSaveFile(savBuffer);
    const {pcBoxes} = extractPokemon(blocks);
    const box1 = pcBoxes[0];
    expect(box1.length).toBeGreaterThanOrEqual(1);

    const darmanitan = box1[0];
    expect(darmanitan.species).toBe(555);
    expect(SPECIES_NAMES[darmanitan.species - 1]).toBe('Darmanitan');
    expect(darmanitan.nickname).toBe('Monke');
  });

  test('Darmanitan IVs are correct', () => {
    const blocks = parseSaveFile(savBuffer);
    const {pcBoxes} = extractPokemon(blocks);
    const darmanitan = pcBoxes[0][0];

    expect(darmanitan.hpIV).toBe(21);
    expect(darmanitan.attackIV).toBe(9);
    expect(darmanitan.defenseIV).toBe(22);
    expect(darmanitan.spAttackIV).toBe(10);
    expect(darmanitan.spDefenseIV).toBe(8);
    expect(darmanitan.speedIV).toBe(18);
  });
});

describe('ROM Reader', () => {
  let romBuffer: ArrayBuffer;

  beforeAll(() => {
    romBuffer = loadTestFiles().romBuffer;
  });

  test('reads Lapras ability from ROM', () => {
    // Lapras species 131, altAbility=0
    const abilityId = getAbilityId(romBuffer, 131, 0);
    expect(abilityId).toBeGreaterThan(0);
    const abilityName = ABILITIES[abilityId - 1];
    // Lapras should have Water Absorb, Shell Armor, or Hydration
    expect(['Water Absorb', 'Shell Armor', 'Hydration']).toContain(abilityName);
  });

  test('calculates Darmanitan level from experience', () => {
    const savBuffer = loadTestFiles().savBuffer;
    const blocks = parseSaveFile(savBuffer);
    const {pcBoxes} = extractPokemon(blocks);
    const darmanitan = pcBoxes[0][0];

    const level = calcLevelFromRom(darmanitan.experience, darmanitan.species, romBuffer);
    expect(level).toBe(38);
  });
});

describe('Showdown Formatter', () => {
  let savBuffer: ArrayBuffer;
  let romBuffer: ArrayBuffer;

  beforeAll(() => {
    ({savBuffer, romBuffer} = loadTestFiles());
  });

  test('formats party Lapras correctly', () => {
    const blocks = parseSaveFile(savBuffer);
    const {party} = extractPokemon(blocks);
    const output = formatPartyMon(party[0], romBuffer);

    expect(output).toContain('Lapras');
    expect(output).toContain('Level: 38');
    expect(output).toContain('Ability:');
    expect(output).toContain('Nature');
    expect(output).toContain('IVs:');
    expect(output).toMatch(/0 Def/);
    expect(output).toMatch(/12 SpA/);
    expect(output).toMatch(/13 Spe/);
    // Should have move lines
    expect(output).toMatch(/^- /m);
  });

  test(`All pokemon`, () => {
    const blocks = parseSaveFile(savBuffer);
    const {party, pcBoxes} = extractPokemon(blocks);
    const result = formatAllPokemon(party, pcBoxes, romBuffer);
    expect(result).toBe(`Lapras
Ability: Shell Armor
Level: 38
Hardy Nature
IVs: 0 Def / 12 SpA / 30 SpD / 13 Spe
- Frost Breath
- Ice Shard
- Icy Wind
- Charm

Eldegoss
Ability: Cotton Down
Level: 38
Lax Nature
IVs: 21 HP / 12 Atk / 0 Def / 4 SpA / 22 SpD / 29 Spe
- Leaf Tornado
- Hyper Voice
- Rapid Spin
- Magical Leaf

Nidoqueen
Ability: Sheer Force
Level: 38
Gentle Nature
IVs: 29 HP / 30 Atk / 10 SpA / 6 SpD / 28 Spe
- Crunch
- Sludge
- Toxic
- Mud Shot

Charizard
Ability: Blaze
Level: 38
Lonely Nature
IVs: 6 HP / 17 Atk / 18 Def / 1 SpA / 11 SpD / 14 Spe
- Fire Fang
- Aerial Ace
- Flame Burst
- Scary Face

Kilowattrel
Ability: Wind Power
Level: 38
Careful Nature
IVs: 28 HP / 21 Atk / 24 Def / 7 SpA / 1 SpD / 15 Spe
- Electro Ball
- Tailwind
- Dual Wingbeat
- Eerie Impulse

Heliolisk
Ability: Sand Veil
Level: 38
Impish Nature
IVs: 26 HP / 27 Atk / 6 Def / 6 SpA / 25 SpD / 23 Spe
- Surf
- Thunder Wave
- Parabolic Charge
- Eerie Impulse

Darmanitan
Ability: Sheer Force
Level: 38
Sassy Nature
IVs: 21 HP / 9 Atk / 22 Def / 10 SpA / 8 SpD / 18 Spe
- Fire Fang
- Flame Burst
- Taunt
- Headbutt

Surskit
Ability: Swift Swim
Level: 13
Sassy Nature
IVs: 9 HP / 0 Atk / 22 Def / 5 SpA / 19 SpD / 4 Spe
- Bubble
- Quick Attack
- Struggle Bug
- Life Dew

Greninja
Ability: Protean
Level: 38
Timid Nature
IVs: 21 HP / 29 Def / 1 SpA
- Icy Wind
- Aerial Ace
- Water Shuriken
- Waterfall

Sizzlipede
Ability: Flame Body
Level: 10
Timid Nature
IVs: 27 HP / 25 Atk / 30 Def / 6 SpA / 7 SpD / 8 Spe
- Ember
- Smokescreen
- Wrap
- Bite`);
  });

  test('formats PC Darmanitan correctly', () => {
    const blocks = parseSaveFile(savBuffer);
    const {pcBoxes} = extractPokemon(blocks);
    const output = formatPCMon(pcBoxes[0][0], romBuffer);

    expect(output).toContain('Darmanitan');
    expect(output).toContain('Level: 38');
    expect(output).toContain('Ability:');
    expect(output).toContain('Nature');
  });

  test('full output has no empty species names', () => {
    const blocks = parseSaveFile(savBuffer);
    const {party, pcBoxes} = extractPokemon(blocks);

    for (const mon of party) {
      const output = formatPartyMon(mon, romBuffer);
      expect(output).not.toContain('Unknown(');
    }

    for (const box of pcBoxes) {
      for (const mon of box) {
        const output = formatPCMon(mon, romBuffer);
        expect(output).not.toContain('Unknown(');
      }
    }
  });
});
