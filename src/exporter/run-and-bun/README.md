# Run & Bun snapshot decoder

Run `npm run build`, serve `dist`, and open `snapshot-decoder.html`. The calculator
also links to it beside **Import box**. Select the Run & Bun `.gba` ROM and a
John GBA `.jg0` through `.jg9` snapshot, decode, and download the JSON. No file
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
Run & Bun ROM offsets are supported. A `.sav` is a battery save, not an emulator
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

const snapshot = await decodeRunAndBunSnapshot(stateBytes, romBytes);
const { collection, warnings } = snapshotToBoxExport(snapshot, 'My snapshot');
const json = JSON.stringify(collection);
```

`decodeRunAndBunMemory` accepts an already-decompressed snapshot for hosts that
provide their own gzip implementation. Neither decoder API depends on the DOM,
local storage, Redux, or Node modules. The box adapter targets the calculator's
Gen 8 names. Static species/move/item names are generated from the existing Run
& Bun Lua tables with `node scripts/generate-run-and-bun-data.cjs`; unlike the
older Lua species-ability assignments, ability IDs and names come from the ROM
(name table `0x3AC0C9`, stride 17).

Layout evidence is preserved in the
[decoder research report](https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md).
Synthetic tests need no ROM/save fixtures:
`npm test -- --runInBand --runTestsByPath src/exporter/run-and-bun/decoder.spec.ts`.
