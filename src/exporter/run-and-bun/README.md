# Run & Bun snapshot decoder

Run `npm run build`, serve `dist`, and open `snapshot-decoder.html`. The calculator
also links to it beside **Import box**. Select a John GBA `.jg0` through `.jg9`
snapshot, decode, and download the JSON. No ROM file is needed. No file
contents are uploaded. The page uses native `DecompressionStream`, so use a
current browser.

On `index.html`, **Import box** loads that JSON and selects the imported
collection immediately. **Import replaces all existing saved collections**;
use **Export All** first if you need to keep them.

## Output

The top level retains the existing collection dictionary:

```text
{
  "<collection name>": {
    "customSets": { "<species>": { "<nickname>": <calculator set> } },
    "party": [ "<species> (<nickname>)" ],
    "gameStateSnapshot": <GameStateSnapshot>
  }
}
```

Set names use each Pokemon's nickname. Duplicate nicknames within the same
species receive numbered suffixes (`Sparky`, `Sparky 2`), without taking another
Pokemon's original nickname. Blank nicknames use the species name with a warning;
reserved object keys receive a suffix and warning. Party order and original
box/slot locations are preserved in snapshot metadata. Eggs/bad eggs remain in the snapshot
but are omitted from calculator sets with explicit export warnings.

Each Pokemon that can mega evolve also gets a box set for every mega form (for
example `Charizard-Mega-X` and `Charizard-Mega-Y`) under the same set name, with
the same level, nature, IVs/EVs and moves, the mega form's ability, and the
matching mega stone held. Mega sets are never added to the party and have no
snapshot metadata of their own. Saving changes to either form in the calculator
copies its level, nature, IVs/EVs and moves to the other forms' sets with the
same name, keeping each form's own ability and item.

`GameStateSnapshot` is JSON-only data, versioned with `schemaVersion: 1`:

- Party and all 14 boxes: identity fields, original locations, box names, species,
  level/experience, nature, ability, IVs/EVs, items, moves, current PP and PP Ups.
- Party HP/stats/status are read from live RAM, not the older cartridge-save copy.
  Box HP/stats/status describe the game's verified withdrawal conversion, not an
  optional healing action. Box PP is **not** refilled.
- All eight bag pockets with decrypted quantities, plus item totals counting each
  owned held item once. Opponent and active-battler records are not extra copies.
- Partial battle memory: battlers and opponent party, active party indices,
  abilities/types, stages, HP/PP/status words, last moves, confirmed restriction
  fields (including Encore, first-turn-out and protection-use history), raw
  condition/timer blocks, AI scores/flags and RNG seed.

Indices are zero-based. Pokemon `id` is a **snapshot-local location key**, not a
cross-import identity claim; original trainer ID and personality are retained
separately. `null` move/item means an explicit empty ID (or the documented
last-move sentinel, retained in `lastUsedMoveRaw`). Opponent maximum PP is `null`
because observed trainer PP is not reliably described by stored PP Ups.

The calculator currently consumes conventional sets/party only. HP, PP, bag,
and battle details are retained in `gameStateSnapshot` for future integration,
not applied to the calculator or simulator. Editing sets does not rewrite the
original snapshot metadata. Import validates the calculator collection shape;
retained snapshot metadata is not validated as simulator input.

## Boundaries

Only the researched John GBA format-10, 740,238-byte decompressed layout and
the bundled reference Run & Bun game-data tables are supported. Other ROM
revisions or modified games are not verified; the snapshot alone does not prove
which ROM produced it. RAM layout, checksum, pointer and ID validation still
apply, but cannot detect every incompatible revision.
A `.sav` is a battery save, not an emulator
snapshot; a `.jsN` is a screenshot. Neither is accepted by this page. The existing
Pokemon Null exporter is unchanged.

The box adapter rejects species, abilities, held items or moves the calculator
cannot represent, rather than silently dropping them. The reusable snapshot
decoder remains independent of calculator export.

**Battle activity and phase remain unknown.** Battle records can remain in RAM
after a battle (including on the PC screen); do not infer an ongoing battle from
`battlerCount`. Protection-use history is not the current Protect shield. Status
masks, delayed effects, suppression/consumption and all timer meanings are not
fully mapped; raw values and coverage/limitations are retained rather than
inventing false/zero facts. AI scratch scores can be stale/uncomputed. Reading
the RNG seed does not predict the next decision.

Progress flags, PC-access legality, encounter limits, Nuzlocke eligibility,
planning constraints and corrections are not inferred. Fainted-box names are
preserved, not treated as permission to use those Pokemon.

Malformed gzip, unsupported layouts, invalid pointers, Pokemon checksum errors,
invalid bag entries and unknown IDs cause explicit errors, not partial exports.
Decoded JSON contains private player data; keep it out of source control.

## Reusable API

```ts
import { decodeRunAndBunSnapshot, snapshotToBoxExport } from './index';

const snapshot = await decodeRunAndBunSnapshot(stateBytes, { stateFileName: 'save.jg9' });
const { collection, warnings } = snapshotToBoxExport(snapshot, 'My snapshot');
const json = JSON.stringify(collection);
```

`decodeRunAndBunMemory` accepts an already-decompressed snapshot for hosts that
provide their own gzip implementation. Neither decoder API depends on the DOM,
local storage, Redux, or Node modules. Both APIs now accept optional source
metadata as their second argument, not ROM bytes. The box adapter targets the
calculator's Gen 8 names.

## Bundled game data

Static species/move/item names are generated from the existing Run & Bun Lua
tables with `node scripts/generate-run-and-bun-data.cjs`. `tables.ts` adds only
the decoder's ability names, species base stats/growth groups/ability slots,
move PP, item pockets and six experience tables (about 57 KB of source).
No ROM executable code, graphics, audio or player data is included.

These tables are pinned to reference ROM SHA-256
`68ec5b0c02e6def8da8dc2b1857b269505418803d44cc2b816fb7471587bf89d`.
`source.gameDataRomSha256` records this table provenance, **not verification
of the ROM that created the snapshot**. The optional `source.romFileName` field
is retained for previously exported snapshots; new imports do not set it.
Unlike the older Lua species-ability assignments, these ability IDs and names
match the reference ROM (name table `0x3AC0C9`, stride 17).

To reproduce the tables locally, use Node 22.18+ and your reference ROM:

```sh
node scripts/generate-run-and-bun-tables.cjs "<reference.gba>"
```

The generator checks the full reference hash before writing and extracts only
the fields above. The ROM is needed only for maintainers regenerating data,
not for builds or imports. Supporting another revision requires verifying its
RAM layout and tables, not merely changing the hash check.

Layout evidence is preserved in the
[decoder research report](https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md).
Synthetic tests use the bundled tables and need no ROM/save fixtures:
`npm test -- --runInBand --runTestsByPath src/exporter/run-and-bun/decoder.spec.ts`.
