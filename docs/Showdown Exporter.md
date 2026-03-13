## Plan: Pokemon Null Save File → Showdown Exporter (Web App)

Build a static web page (HTML + TypeScript/JS) that lets you upload a `.sav` file from John GBA, parses the GBA save format used by Pokemon Null (pokeemerald-expansion), decrypts the Pokemon data, and outputs Showdown-format text. No server needed — all processing runs client-side. The code should live in src/exporter. To help validate, you can use 
""%userprofile%\Downloads\Pokemon Null.gba"
"%userprofile%\Downloads\Pokemon Null.sav"
The lead of the current party is a Lv38 Lapras named Nessie. It's IVs are 31 HP 31 Attack 0 Defense 12 Sp. Attack 30 Sp. Def 13 Speed

The first pokemon in box 1 of the PC is a Lv38 Darmanitan named Monke it's IVs are 21 HP 9 Attack 22 Defense 10 Sp Attack 8 Sp Def 18 Speed

---

### Phase 1: Save File Parsing
1. **Parse GBA save sectors** — Read the 128KB `.sav` as an ArrayBuffer. Split into 32 sectors of 4096 bytes. Two save slots occupy sectors 0–13 and 14–27. Each sector has a 12-byte footer at offset 0xFF4: section ID (u16), checksum (u16), signature (u32 = `0x08012025`), save index (u32). Active slot = higher save index.
2. **Reassemble save blocks** — Sort the 14 active-slot sectors by section ID:
   - Section 0 → SaveBlock2 (player info)
   - Sections 1–4 → SaveBlock1 (party, items, game state)
   - Sections 5–13 → PokemonStorage (PC boxes)
   - Concatenate each group's 3968-byte data portions in section-ID order.
3. **Validate sector checksums** — 16-bit sum of 32-bit words over each sector's 3968 data bytes. Warn user if corrupted.

### Phase 2: Pokemon Data Extraction
4. **Locate party data in SaveBlock1** — Determine offset of `gPlayerPartyCount` / `gPlayerParty` within SaveBlock1. The Lua script has RAM addresses (`0x200536d`, `0x2005370`) — the offset within the save block needs empirical verification against a test save. Store as a configurable constant.
5. **Locate PC boxes in PokemonStorage** — First 4 bytes = current box index, then boxes follow. Each box: name/wallpaper header + 30 × 84-byte BoxPokemon structs (pokeemerald-expansion uses 84 bytes, not vanilla 80).
6. **Decrypt BoxPokemon** — For each 84-byte struct:
   - Read `personality` (u32 @ +0), `otId` (u32 @ +4)
   - XOR key = `otId ^ personality`
   - Substructure order from `personality % 24` (same 24-entry shuffle table as Lua script)
   - XOR-decrypt four 12-byte substructures (at offset +36, per the Lua `address + 32 + 4` pattern)
   - Extract: species, held item, experience, moves ×4, IVs (6×5 bits packed), ability index, hidden nature
7. **Party vs PC mons** — Party mons (104 bytes) have level stored directly. PC mons require level calculation from experience + species growth curve.

### Phase 3: Lookup Tables & Formatting
8. **Port Lua lookup tables to JS** — Convert the `move`, `mons`, `item`, `abilities`, `nature` arrays directly from NullLuaV1.1.lua. Adjust for 0-indexed JS arrays.
9. **Showdown formatting** — Output per Pokemon: species, item, ability, level, nature, IVs, moves. Special-case Hidden Power to append type (IV parity formula from Lua `getHP`).
10. **Ability lookup** — The `altAbility` field on each mon (0–2) selects which species ability it has, but the species→abilities mapping lives in ROM, not the save file. **Hardcode a species→abilities table** extracted from the Pokemon Null ROM data. *(Alternative: add a ROM upload input to read it dynamically.)*
11. **PC level calculation** — Port the 6 experience curve functions from the Lua script. Also need a species→growth-rate mapping from ROM data.

### Phase 4: Web UI
12. **Single HTML page** — File input (`.sav`), Export button, read-only textarea for output, Copy to Clipboard button.
13. **All client-side** — FileReader API → ArrayBuffer → parse → display.
14. **Host** — GitHub Pages / Netlify / any static host. Could even be a single `.html` file with inline JS.

### Phase 5: Verification
15. **Test against Lua script output** — Load the same save in mGBA, run the Lua script, compare output character-by-character with the web tool's output.

---

### Key Risk
**Save block offsets** — The Lua script gives RAM addresses, not save-file offsets. The offset of party/PC data within the save sections depends on Pokemon Null's struct layout. You'll need to either:
- (a) Examine the pokeemerald-expansion source (`include/global.h` → `struct SaveBlock1`, `include/pokemon.h` → `struct BoxPokemon`)
- (b) Empirically locate data by searching a known save for a recognizable personality value

This is the main "figure it out" step. Everything else is straightforward porting of the Lua script logic.

### Decisions
- **Web app**, not Android app — simpler, works everywhere
- **IVs only**, no EVs (matching Lua script)
- **Pokemon Null first** — Run & Bun can follow with swapped lookup tables (same engine, same struct layout, different data)
- **Hardcode species→abilities** initially rather than requiring ROM upload

### Further Considerations
1. **ROM upload for ability/growth data** — If hardcoding is fragile, add a second file input for the ROM to read `gSpeciesInfo` dynamically. Recommend: start hardcoded, add ROM upload later if the ROM updates frequently.
2. **Multi-hack support** — Run & Bun has different lookup tables and possibly different offsets. Design lookup tables as a swappable data module + a dropdown selector. Easy to add later.
3. **Box grouping** — Output all PC mons flat (like the Lua script) or group by box? Recommend flat to start.

---

### Resources
- **Bulbapedia — Gen III save data structure**: https://bulbapedia.bulbagarden.net/wiki/Save_data_structure_(Generation_III) — Sector layout, footer format, checksum algorithm, section-to-block mapping
- **Bulbapedia — Gen III Pokemon data structure**: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_III) — BoxPokemon/PartyPokemon struct, substructure encryption, shuffle order table
- **pokeemerald-expansion source (rh-hideout)**: https://github.com/rh-hideout/pokeemerald-expansion — The ROM hack base used by Pokemon Null
  - [`include/pokemon.h`](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/pokemon.h) — `struct BoxPokemon`, `struct Pokemon` definitions (84-byte / 104-byte structs)
  - [`include/global.h`](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/global.h) — `struct SaveBlock1`, `struct SaveBlock2` layouts (needed to find party offset within save sections)
  - [`src/save.c`](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/src/save.c) — Save sector logic, section ID assignments
  - [`src/pokemon.c`](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/src/pokemon.c) — `GetBoxMonData`, `DecryptBoxMon`, experience curve implementations
  - [`include/pokemon_storage_system.h`](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/pokemon_storage_system.h) — PC box structure definition
- **Bulbapedia — Experience curves**: https://bulbapedia.bulbagarden.net/wiki/Experience — Formulas for all 6 growth rates (erratic, fast, medium fast, medium slow, slow, fluctuating)
- **Bulbapedia — Hidden Power type calculation**: https://bulbapedia.bulbagarden.net/wiki/Hidden_Power_(move)/Calculation — IV parity formula for determining Hidden Power type
- **NullLuaV1.1.lua** (attached) — Reference implementation with all Pokemon Null lookup tables and decryption logic

"C:\Users\tncla\Downloads\NullLuaV1.1.lua"
