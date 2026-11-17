# Run & Bun save and emulator-snapshot decoder research

Research for [#114](https://github.com/tnclark8012/runbuncalc/issues/114), recorded 2026-11-17 UTC. The domain requirements are in the [agreed player-state contract on #125](https://github.com/tnclark8012/runbuncalc/issues/125#issuecomment-6941028893); Android file access is covered in [the access report](john-gba-import-paths.md).

## Result and scope

**The supplied ordinary save and John GBA snapshots provide a feasible import path for the core player-state facts.** Party/PC records, box names, all eight bag pockets and quantities, held items, and the inputs for level, nature, ability, stats, and PP have been located and checked. Emulator snapshots additionally contain live battle state, several parts of which have positive verification.

This is extraction and interpretation research, not a production importer, architecture decision, full AI implementation, or promise of compatibility with other binaries. Broad version/support-boundary work was explicitly excluded from #114. Addresses below describe the inspected ROM and samples only.

No uploaded ROM, save, screenshot, player name, Pokemon identity, roster, progress, inventory, RNG seed, or decoded player-state dump is included. Structural addresses and algorithms are recorded so the work does not depend on conversation memory. The original inputs and temporary probes remained local.

### Coverage against the core contract

| Required fact | Ordinary cartridge save | Emulator snapshot | Evidence |
| --- | --- | --- | --- |
| Owned party and storage records | Saved party and PC storage | Live party and PC storage | Record checksums, storage correspondence, and ROM copy routines |
| Individual identity and location | Personality, original-trainer ID, header facts, party/box/slot | Same, with current live positions | Decrypted records; identity is not interchangeable with slot |
| Box names, including data needed for the exact `Fainted` rule | Present | Present | Every fixed-length box-name entry checked and matched across supplied sources |
| Species/form, held item, experience, moves/current PP, PP bonuses | Present | Present | Decryption, ROM tables, and PP bounds |
| Nature, IV/EV inputs, ability selection | Present | Present | Run & Bun packing, ROM readers, and party-stat/active-ability cross-checks |
| Party level, current HP/status, max HP, five other stats | Stored in party suffix | Stored in live party suffix; effective battle values also have a separate representation | Party records and ROM data accessors |
| Boxed level and battle stats | Derived, not stored as a party-stat suffix | Same | ROM growth/experience/species data and stat calculation |
| Boxed current HP/status | Not stored in the boxed-record suffix, because that suffix does not exist | Same for boxed records | Actual boxed-to-party conversion clears status and reconstructs HP/stats; see below |
| Bag item quantities | Eight pockets, encrypted quantities | Same through live save-block pointers | Actual ROM getter/initializer plus full pocket traversal |
| Held-item totals | One assignment per party/boxed record | Same | Add held copies to bag quantities once, without counting active battle records again |
| Arbitrary retrievability/encounter limits | Not a universal scalar established by this research | Battle context is available, but not proof that PC selection is legal now | Contextual eligibility, verified encounter data, and manual facts remain part of #125 |
| Live battle history/conditions | Not preserved by an ordinary in-game save | Present; partially decoded | Separate live-state sections below |

An importer must distinguish **stored**, **verified derivation**, **not represented by this source**, and **not decoded yet**. They are not equivalent to zero, no item, no status, or no ongoing battle.

## Evidence and how to read the addresses

- **Local primary evidence:** inspect the supplied files locally, validate record/container structure, and trace the supplied executable's reads/writes. ROM addresses below identify those traces; no copyrighted binary or disassembly listing is published.
- **Repository primary evidence:** the existing [Run & Bun Lua exporter][R1] contains party/storage anchors and game-specific record interpretation. It is useful prior art, not proof that every offset or lookup is correct.
- **Independent checks:** record checksums, matching storage/name data between sources, ROM pocket membership for every occupied bag slot, reproducing all supplied party stats/levels, and matching active abilities with selected party members.
- **Public engine references:** [pret/pokeemerald][P1] and [pokeemerald-expansion][P5] explain mechanisms and aid function identification. Their structures are **not** assumed to be the inspected Run & Bun structures.

All multibyte values here are little-endian. A ROM virtual address is `0x08000000 + file offset`; clear a Thumb function pointer's low bit before disassembly. Follow actual code branches: literal pools and jump tables are data, and linear disassembly across them can produce misleading instructions.

## 1. Input kinds

| Input | Observed structure | Meaning |
| --- | --- | --- |
| `.gba` | Game executable and static tables | Needed for game-specific interpretation; not player progress |
| `.sav` | 128 KiB cartridge flash image | Persistent state as of an in-game save, not the running battle |
| `.jgN` | Gzip-compressed emulator state | Running machine state at snapshot time |
| `.jsN` | JPEG preview | Screenshot companion, not RAM or another progress format |

The inspected snapshots inflate to 740,238 bytes. The decompressed header starts with little-endian value `10` followed by the game header text. These are sample observations, not an emulator-format specification. The [VBA-M serializer][P6] provides useful RAM-order context, but no claim is made that John GBA uses an identical implementation.

### RAM translation in these snapshots

```text
EWRAM file offset = 0x85DF + (address - 0x02000000)
IWRAM file offset = 0x01DF + (address - 0x03000000)
```

EWRAM mapping was established using occupied, checksum-valid PC records and independently corroborated by party, storage, bag, and battle data. IWRAM mapping is corroborated by the game's pointer-initialization routine and the live structures those pointers identify, not just serialization-order speculation.

## 2. Cartridge-save reconstruction

The flash image contains two 14-section save slots in the first 28 sectors; sectors are 4,096 bytes. Remaining flash sectors must not be interpreted as more player-state slots. Physical sector order rotates: reconstruct by section ID, not the sector's physical index. [P2; local footer checks]

| Sector-relative offset | Field |
| --- | --- |
| `0x0000..0x0F7F` | 3,968-byte payload region used for reconstruction |
| `0x0FF4` | `u16` section ID |
| `0x0FF6` | `u16` checksum |
| `0x0FF8` | `u32` signature, `0x08012025` |
| `0x0FFC` | `u32` save counter |

Both supplied slots had complete section-ID sets and internally consistent counters. All 28 payload checksums matched: sum the 992 little-endian words modulo `2^32`, then add its high and low halfwords modulo `2^16`. This establishes the supplied sample's integrity; recovery rules for torn saves, counter wrap, or other layouts are not implemented here. [P2; local checks]

Reconstruct section `0` as SaveBlock2, `1..4` as SaveBlock1, and `5..13` as PokemonStorage, using section-ID order and payload stride `0xF80`. Do not concatenate whole sectors including footers.

For the supplied ordinary save, SaveBlock1's party count is a byte at `+0x234`, and its party starts at `+0x238`, stride 100. Actual ROM routines at `0x08094C30`/`0x08094C78` copy between those fields and the live party; the fields also yielded valid party records. The existing generic exporter is not a ready-made Run & Bun configuration. [R2, R3; ROM copy trace]

## 3. Live save-block, party, and storage anchors

The ROM initialization routine at `0x08094A98` assigns these globals and initializes bag pointers:

| Global or data | RAM address | Notes |
| --- | --- | --- |
| SaveBlock1 pointer | `0x03005D9C` | Dereference; observed target `0x02024CBC` |
| SaveBlock2 pointer | `0x03005DA0` | Dereference; observed target `0x02024018` |
| PokemonStorage pointer | `0x03005DA4` | Dereference; observed target `0x02028848` |
| Live player party count | `0x02023A95` | Byte |
| Live player party | `0x02023A98` | 100-byte records |
| Live enemy party | `0x02023CF0` | 100-byte records |

Read the live player party in a snapshot, not an arbitrary matching record or the save block's older party copy. The game's copy-to-save operation is distinct from live party updates. Bag data uses the pointed-to save blocks. Pointer dereferencing and object bounds must be respected rather than assuming every observed target is a portable constant. [ROM initialization/copy traces; R1; P3]

## 4. Pokemon record decoding

Run & Bun boxed records are 80 bytes; party records add a 20-byte suffix. Four encrypted 12-byte substructures begin at `+0x20`.

1. Read personality at `+0x00` and original-trainer ID at `+0x04`.
2. XOR each encrypted `u32` with `personality XOR otId`.
3. Use `personality % 24` and the existing substructure-order table to locate Growth, Attacks, EVs/condition, and Misc.
4. Validate the decrypted 24-halfword sum modulo `2^16` against the checksum at `+0x1C`.
5. Decode only after distinguishing occupied records, empty slots, eggs, and bad-egg flags. A checksum failure is not an empty slot. [R1, R3; P1; local checks]

Header names use the game's character encoding, not ASCII/UTF-8; `0xFF` terminates a string. The repository has an explicit indexed [GBA character decoder][R4]. Avoid blindly reproducing Lua-versus-zero-based table indexing.

### Core decrypted fields

| Substructure | Offset | Field |
| --- | --- | --- |
| Growth | `+0x00`, `+0x02` | Species/form ID, held-item ID (`u16` each) |
| Growth | `+0x04` | Experience (`u32`) |
| Growth | `+0x08` | Four packed two-bit PP-bonus counts |
| Growth | `+0x09` | Friendship |
| Growth | Low five bits of byte `+0x0A` | Changed/hidden nature field; `26` means use personality-derived nature |
| Attacks | `+0x00..0x07` | Four move IDs (`u16`) |
| Attacks | `+0x08..0x0B` | Four current PP bytes |
| EVs/condition | `+0x00..0x05` | HP, Attack, Defense, Speed, Sp. Attack, Sp. Defense EV bytes |
| Misc | `u32 +0x04` | IV packing described below |
| Misc | Bits 29-30 of `u32 +0x08` | Ability-slot selection |

**Important Run & Bun differences:** IV shifts are `1, 6, 11, 16, 21, 26`, masked with `31`, in HP/Attack/Defense/Speed/SpA/SpD order. The generic Gen III shifts `0, 5, 10, 15, 20, 25` did not reproduce supplied party stats. The changed-nature field is also not at the generic exporter's shifted bit position. Do not copy the current Pokemon Null parser/config unchanged. [R1, R3; exact stat cross-checks]

The sample EV inputs were zero; their locations and use are supported by the Lua layout and the actual stat routine's data reads/division by four. Nonzero-EV sample validation is not claimed.

### Party suffix

| Record offset | Field |
| --- | --- |
| `+0x50` | `u32` major status |
| `+0x54` | Level byte |
| `+0x55` | Mail byte |
| `+0x56` | `u16` current HP |
| `+0x58` | `u16` max HP |
| `+0x5A`, `+0x5C`, `+0x5E`, `+0x60`, `+0x62` | `u16` Attack, Defense, Speed, SpA, SpD |

These are party-record offsets, **not** active-battle-record offsets. The actual getter at `0x08085D70` and the supplied data agree. The Lua exporter's four-byte read of mail should not be treated as evidence that mail itself occupies four bytes.

### Identity

Personality and original-trainer ID are available, along with header facts and exact source location. They support matching an individual across observed party/box moves, but are not proof of global uniqueness in the presence of cloned/duplicate records. Preserve slot/location independently; ambiguous continuity must not silently move an exclusion onto another Pokemon.

## 5. Verified derivations and ROM tables

| ROM virtual address | Meaning | Relevant fields |
| --- | --- | --- |
| `0x083B7CE0` | Species information, stride 36, including species zero | Six base stats `+0..5`; types `+6,+7`; growth rate `+0x15`; three ability IDs (`u16`) at `+0x18,+0x1A,+0x1C` |
| `0x083B7040` | Experience thresholds | Growth-group stride 404 bytes; level entries are `u32`, levels `0..100` |
| `0x083B0C5C` | Move data, stride 20 | `u16` effect `+0`; `u16` power `+2`; base PP byte `+6` |
| `0x08678D60` | Item data, stride 44 | Item name begins at entry start; pocket ID byte `+0x1A` |

ROM readers corroborate these tables; the boxed-level reader at `0x080851D8` reads growth rate `+0x15` and scans the actual experience table. All supplied party levels were reproduced from experience using those ROM thresholds.

The nature helper at `0x08088A30` uses the changed-nature field when applicable and falls back to `personality % 25` for its sentinel value. The stat routine at `0x08084E14` applies the normal level/base-stat/IV/EV calculation, integer rounding, nature adjustment, and species-specific handling such as the one-HP species. Reconstructing stats with the Run & Bun IV packing reproduced every supplied party's six stored battle stats; the generic packing did not.

Ability slots index the species' three `u16` ability IDs. A zero entry falls back to the first ability, as in the Lua exporter; this matters for species with an unused middle slot. This interpretation matched the selected party records' abilities in the supplied active battles. Effective live abilities can still differ after battle effects; do not overwrite those with a party-level derivation.

For each move slot, `maxPP = basePP + floor(basePP * ppBonus / 5)`. The current PP values in all occupied supplied records were within that derived maximum. Retain the saved current PP; deriving a maximum is not a refill.

These checks establish useful derivations for the supplied data, not exhaustive validation of every form, item, ability, or mechanics rule. Preserve raw IDs with correct game-specific interpretation rather than substituting another game's enum tables.

## 6. Box storage and boxed HP/status

PokemonStorage layout:

| Storage-relative offset | Data |
| --- | --- |
| `+0x0000` | Current-box header |
| `+0x0004` | 14 boxes x 30 records x 80 bytes |
| `+0x8344` | 14 box names, stride 9 bytes |
| `+0x83C2` | 14 wallpaper bytes |
| `+0x83D0` | End of this storage structure |

The actual storage access routine at `0x080F0774` bounds box indices to `0..13`, slots to `0..29`, and computes the record from `*0x03005DA4 + 4 + box*2400 + slot*80`. Every occupied supplied PC record validated, and every box-name entry was terminated and matched between cartridge storage and the supplied snapshots.

This makes #117's exact `Fainted` box-name fallback implementable without inferring the box's meaning from its number, wallpaper, or species.

**There is no party HP/status suffix on a boxed record.** This is an actual representation distinction, not an unfinished decoder excuse:

- The boxed-to-party conversion at `0x08085114` copies 80 bytes, explicitly clears major status/current HP/max HP, initializes mail, and calls the actual stat routine.
- With both prior HP and max HP zero, the stat routine reconstructs full HP and stats; it also has the species-specific one-HP branch.
- The storage accessor at `0x080F0774` calls that conversion for a selected box/slot. Move PP comes from the copied boxed record, not from an invented refill.

Thus a boxed Pokemon's materialized party HP/status can be a **verified game-rule derivation**, not a pretend raw HP field or an assumed optional healing action. This does not override player exclusions or the `Fainted` rule, and it does not make PC retrieval legal in the middle of a battle. Interpret actual retrieval and preparation constraints separately. [ROM conversion/storage traces; P1 as comparison]

## 7. Bag inventory: all eight pockets

The actual pocket initializer is `0x080F504C`. It fills eight 8-byte descriptors at `0x020393E0`: a slot pointer, a capacity byte, and padding. It is not the five-pocket structure from unmodified Emerald.

Each item slot is four bytes: `u16 itemId`, `u16 encryptedQuantity`. The actual quantity getter at `0x080F4FB0` computes:

```text
quantity = encryptedQuantity XOR low16(*(SaveBlock2 + 0xA4))
```

The item ID is not XOR-encrypted with that quantity key. Use the key from the **same source state**; a key taken from a different save/snapshot produces incorrect counts. The rekey helper at `0x08095094` corroborates the key location and halfword operation.

| Pocket ID | Descriptive category | SaveBlock1 offset | Capacity |
| --- | --- | --- | --- |
| 1 | General items | `+0x04E8` | 130 |
| 2 | Medicine | `+0x0A08` | 33 |
| 3 | Held/battle items | `+0x0A8C` | 128 |
| 4 | TMs/HMs | `+0x0810` | 60 |
| 5 | Berries | `+0x0900` | 66 |
| 6 | Balls | `+0x07A4` | 27 |
| 7 | Key items | `+0x06F0` | 45 |
| 8 | Mega Stones | `+0x0C8C` | 50 |

The labels are descriptive; numeric IDs, pointers, and capacities are the decoding facts. Pocket order is not memory-address order. In each supplied snapshot, all eight runtime descriptors matched the ROM initializer's SaveBlock1-relative offsets and capacities.

All slots in every pocket were traversed in the ordinary save and supplied snapshots. For every occupied slot, the item ID was in range, the decoded quantity was positive, and the ROM item's pocket ID exactly matched the containing pocket. Empty slots decoded to zero quantity. These checks, together with the actual getter trace, verify nonzero quantities and membership, not just plausible-looking bytes. The same method works on reconstructed SaveBlock1/2 or their snapshot pointers.

To establish usable bag-plus-held ownership, sum bag slots by item ID and add each distinct owned party/boxed record's held item once. Do not count the active battle representation as another owned copy. A planned reassignment is not an additional item. This is #117/#125's bag-plus-held scope; do not silently substitute other stores/caches or promise ownership of resources not established by those inputs.

## 8. Optional live-battle state

These findings are preserved because they are useful for later battle hydration. **Completing every entry below is not a prerequisite for resolving the core access/coverage question in #114.**

### Context and battlers

| RAM address | Meaning |
| --- | --- |
| `0x02023364` | `u32` battle-type flags |
| `0x020233E4` | Battler count |
| `0x020233E6 + 2*b` | Active party index (`u16`) |
| `0x020233FC + 0x5C*b` | 92-byte active battler |
| `0x020235CC + 2*b` | Last-used move (`u16`); sentinel `0xFFFF` is not a valid move |
| `0x02023648 + 4*b` | Additional status array, `status3` family |
| `0x02023658 + 4*b` | Another additional-status array; not fully classified |
| `0x02023668 + 40*b` | Restriction/counter block described below |

Verified doubles indexing is player battlers `0,2` and CPU battlers `1,3`, with party indices identifying the selected members. Do not infer the party owner from species or which move was observed.

Active battler offsets:

| Offset | Field |
| --- | --- |
| `+0x00` | Species/form (`u16`) |
| `+0x02..0x0A` | Attack, Defense, Speed, SpA, SpD (`u16`) |
| `+0x0C` | Four move IDs (`u16`) |
| `+0x14` | Packed IV/ability-number data, not fully decoded here |
| `+0x18` | Eight stage bytes; neutral is 6 |
| `+0x20` | Current ability (`u16`) |
| `+0x22..0x24` | Type bytes |
| `+0x25..0x28` | Current PP bytes |
| `+0x2A` | Current HP (`u16`) |
| `+0x2C` | Level byte |
| `+0x2E` | Max HP (`u16`) |
| `+0x30` | Current held item (`u16`) |
| `+0x50`, `+0x54` | Major and volatile status words |

The public engine's comments around HP/status offsets do not describe this alignment. Prior speculative `HP +0x28` / `status +0x4C` layouts were rejected by the actual data. Party and battle records are different representations, not duplicate Pokemon to add together.

### Restrictions and history

Let `D = 0x02023668 + 40*b`.

| Offset | Meaning / evidence |
| --- | --- |
| `D+0x06` | Encored move (`u16`), positive sample and actual removal/countdown checks |
| `D+0x08` | Protection-use history counter, positive sample and Protect scoring read |
| `D+0x0F`, low nibble | Disable timer read by AI guard; no positive Disable sample yet |
| `D+0x10` | Encored move slot, zero-based; used to compare current slot contents with locked move |
| `D+0x11`, low nibble | Encore countdown; positive sample and actual decrement routine |
| `D+0x11`, high nibble | Separate packed data; preserved by decrement, not interpreted as part of the current countdown |
| `D+0x16`, low nibble | Taunt timer read by AI guard; no positive Taunt sample yet |
| `D+0x19` | First-turn-out byte, checked by Fake Out's bad-move rule |
| `D+0x1A`, bit 0 | Truant phase read by inability helper; positive Truant sample not supplied |

Encore's end-turn code at `0x080441C4..0x0804427A` checks the stored slot/move, decrements only the low timer nibble, and clears the lock when appropriate. Thus the whole packed byte must not be reported as a turn count.

Fake Out's bad-move branch at `0x08158046` checks first-turn-out and applies a penalty when it has expired; its viability branch at `0x0815CA28` gives its documented preference. The previous-turn move and the first-turn flag were independently readable in the supplied post-Fake-Out snapshot. A previous-turn flinch must not become a current-turn flinch.

Protection-use history is not the current-turn Protect shield. The temporary per-turn protection structure is not completely mapped by this report; an earlier exploratory zero read at an assumed address is not proof of the shield layout or clearing point. Do not use the history counter as a shield flag.

`0x03005D10` is a corroborated battle-results structure candidate: `+0x13` behaves as a completed-turn counter, with related species/move fields nearby. Keep internal completed-turn numbering distinct from the displayed upcoming turn, and verify snapshot phase rather than treating every snapshot as a player action prompt.

### Weather, field, and sides

| RAM address | Data |
| --- | --- |
| `0x020237C8` | `u16` weather flags |
| `0x02023A58` | `u32` field flags |
| `0x02023A5C` | Field timers |
| `0x02023610 + 4*side` | `u32` side flags; side 0 player, 1 CPU |
| `0x02023618 + 24*side` | Side timers/counts |

These blocks were located through ROM reads/writes, but the supplied samples did not positively exercise weather, screens, terrain, or hazards. Their zero contents are not full nonzero-layout validation.

ROM-grounded side timer offsets: Reflect timer/battler `+0/+1`; Light Screen `+2/+3`; Mist `+4/+5`; Safeguard `+6/+7`; Spikes layers `+8`; Toxic Spikes layers `+9`; Stealth Rock presence `+0xA`; Sticky Web presence `+0xB`; Aurora Veil timer/battler `+0xD/+0xE`; Tailwind `+0xF/+0x10`; Lucky Chant `+0x11/+0x12`. Leave `+0xC` and `+0x13..0x17` unclassified.

Reference side masks with supporting ROM checks, not a fully positive-tested set: Reflect `0x1`, Light Screen `0x2`, Sticky Web `0x4`, Spikes `0x10`, Safeguard `0x20`, pending future attack `0x40`, Mist `0x100`, Tailwind `0x400`, Aurora Veil `0x800`, Lucky Chant `0x1000`, Toxic Spikes `0x2000`, Stealth Rock `0x4000`, Quick Guard `0x40000`, Wide Guard `0x80000`, Crafty Shield `0x100000`, Mat Block `0x200000`. Conditions affect a side; the side need not be the one that created them.

Field-mask reference candidates are Magic Room `0x1`, Trick Room `0x2`, Wonder Room `0x4`, Mud Sport `0x8`, Water Sport `0x10`, Gravity `0x20`, Grassy/Misty/Electric/Psychic terrain `0x40/0x80/0x100/0x200`, Ion Deluge `0x400`, Fairy Lock `0x800`, permanent terrain `0x1000`. ROM timer checks corroborate Wonder Room `+2`, Magic Room `+3`, Trick Room `+4`, and Gravity `+6` relative to field timers. Remaining proposed timer slots need validation; weather duration and Wish/Future Sight timers are not mapped completely. [P5; ROM traces]

### Status-mask reference boundary

Public engine definitions suggest the usual major-status low sleep bits, poison/burn/freeze/paralysis/toxic flags, and volatile confusion, flinch, recharge, Substitute, Destiny Bond, trapping, Curse, and Torment flags. The extra-status family includes candidates for Leech Seed, Perish Song, Yawn, Imprison, suppression, grounding/airborne effects, Heal Block, Aqua Ring, and Laser Focus.

These are useful trace hypotheses, **not a fully verified Run & Bun bitfield contract**. Use the actual game's readers/setters and a positive sample before promoting an untested status mask or timer. The upstream restriction structure is especially unsafe to copy: observed protection-history and other offsets differ from public versions.

## 9. Compiled AI findings

Function labels below are inferred from control flow/effects; the ROM does not supply these symbols. The executable contains actual scoring/dispatch logic, not only a textual description of the AI.

| ROM address | Inferred role |
| --- | --- |
| `0x086B0DD8` | AI function dispatch table |
| `0x08154D08` | Dispatcher |
| `0x08154E1C` | Bad-move scoring |
| `0x0815A05C` | Try-to-faint scoring |
| `0x0815AA90` | Viability/move-specific scoring |
| `0x0815A124` | Doubles scoring |
| `0x0815DBF0` | Strongest-move scoring |
| `0x081547A4`, `0x08154A38` | Singles and doubles selection |
| `0x08155B24` | Bad-move effect jump table |
| `0x0815ACFC` | Viability effect-minus-one jump table |

The `u32` pointer at `0x02023A18` identifies BattleResources. Its `+0x14/+0x18/+0x1C/+0x20` pointers lead to AI thinking, logic/cache, party data, and battle history respectively. Thinking scores are four **16-bit** values at `+4`; AI flags are `u32 +0x10`. The inspected configuration enabled bad-move, try-to-faint, viability, and strongest-move rules. A cache being zero at the player's prompt does not establish zero upcoming damage or a finished CPU decision.

Positive trace checks covered strongest-damage and KO preferences, Fake Out, Protect, and Stealth Rock. Two observed Protect details differ from [docs/ai.md][R5]: an opponent-negative-status branch adds 2 rather than the prose's 1, and a repeated-protection branch applies -10 rather than the prose's -20. Treat these as traced branch findings requiring mechanics/AI-fidelity follow-up under #124, not a silent rewrite of the entire scoring model.

The RNG routine at `0x0808BE0C` uses the seed at `0x03005D90` and the GBA LCG update `seed = seed * 0x41C64E6D + 0x6073` modulo `2^32`, returning the upper halfword. No player seed is published. The threshold helper at `0x0815E274` uses modulo 255, so exact probabilities need not match rounded prose percentages.

Reading a seed is not sufficient to predict the exact next CPU choice: snapshot phase and intervening RNG consumption matter. A player's pending action buffer is not automatically information the AI is entitled to use. Damage ranks, speed comparisons, KO/survival predicates, legal switches, and risk are derived mechanics, not extra raw flags to read from memory. [R5; #116/#124]

## 10. Verification performed and follow-up boundary

Private local probes checked the exact required structures, not only nearby plausible data:

- Both cartridge slots' section sets/signatures/checksums; party records at the actual serialized offsets.
- Every occupied supplied party/PC record's decrypted checksum; occupied headers versus valid-record decoding.
- Every box-name entry and correspondence between persistent storage and snapshots.
- Actual ROM-table experience-to-level derivation, all supplied party stats using the Run & Bun IV/nature layout, and current PP against move/base-PP/bonus data.
- Every slot in all eight bag pockets for the ordinary save and snapshots, including empty quantities and nonzero item IDs/counts with exact ROM pocket membership.
- All eight runtime pocket descriptors against the initializer's offsets/capacities.
- Available active battler abilities against party-slot ability derivations, plus independently verified live-history/restriction examples.

These checks establish bounded feasibility and core-data coverage. They do not claim a production recovery parser, cross-version support, exhaustive nonzero mechanics samples, or exact AI/risk guarantees.

Remaining implementation/fidelity work is explicit rather than a blocker invented for #114:

- Build a reusable importer with integrity/error reporting and the provenance/replacement semantics agreed in #125.
- Apply contextual eligibility and encounter team limits without inferring them solely from ownership, current map, or presence in a box.
- Complete live snapshot-phase handling and optional statuses, suppression/consumption, move locks, delayed effects, weather/terrain/screen timers, and doubles choice/target timing.
- Use paired snapshots around a specific nonzero effect when a positive layout check is needed. No more Encore/Protect sample is needed just to re-prove the fields already checked.
- Validate game mechanics and compiled-AI differences under #124 before making probability guarantees.

### Reproducing the research without publishing private samples

Keep the user's files outside the repository. Use a local Python 3 interpreter for `gzip`, `struct`, and record/checksum probes; Capstone's ARM Thumb decoder is useful for targeted executable inspection. The `python` command in the research environment selected Python 2, so the probes used `py -3`.

Reconstruct sections or RAM using the offsets above; check every occupied record/pocket, then compare independent representations and the ROM's actual accessors. Use source-specific keys and ROM data, not values borrowed from a different snapshot. For a live restriction, inspect its writer/decrement/clear paths and compare a known gameplay event with the resulting field. Emit pass/fail diagnostics rather than player data into any publishable artifact.

## Sources

The executable addresses in this report are primary-source trace locations in the locally supplied game. Their binaries and private sample outputs are intentionally not attached. Public source helps reproduce mechanisms, but is not a substitute for checking those local traces.

- [R1] [Existing Run & Bun Lua exporter, recorded repository revision](https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/runandbun_script_imports.lua): record ordering, nature/IV/ability interpretation, and live party/storage anchors.
- [R2] [Existing save parser](https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/save-parser.ts): prior art, not a completed Run & Bun importer.
- [R3] [Existing Pokemon parser](https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/pokemon-data.ts): comparison showing why generic/Pokemon Null field packing cannot simply be reused.
- [R4] [GBA character map](https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/charmap.ts).
- [R5] [Repository AI reference](https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/docs/ai.md): documented behavior, explicitly not exhaustive.
- [P1] pret/pokeemerald: [Pokemon definitions](https://github.com/pret/pokeemerald/blob/master/include/pokemon.h) and [Pokemon operations](https://github.com/pret/pokeemerald/blob/master/src/pokemon.c), including boxed conversion/stat calculation.
- [P2] pret/pokeemerald: [save implementation](https://github.com/pret/pokeemerald/blob/master/src/save.c).
- [P3] pret/pokeemerald: [load/save operations](https://github.com/pret/pokeemerald/blob/master/src/load_save.c), including separate live-party and saved-party copies.
- [P4] pret/pokeemerald: [item operations](https://github.com/pret/pokeemerald/blob/master/src/item.c), comparison for bag quantity XOR, pointer setup, and distinction from PC item quantities.
- [P5] rh-hideout/pokeemerald-expansion, [battle definitions at expansion/1.6.2](https://github.com/rh-hideout/pokeemerald-expansion/blob/expansion/1.6.2/include/battle.h) and [battle constants](https://github.com/rh-hideout/pokeemerald-expansion/blob/expansion/1.6.2/include/constants/battle.h): reference hypotheses, not exact Run & Bun layouts.
- [P6] VisualBoyAdvance-M, [GBA state implementation](https://github.com/visualboyadvance-m/visualboyadvance-m/blob/master/src/core/gba/gba.cpp): serialization-order reference only.

[R1]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/runandbun_script_imports.lua
[R2]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/save-parser.ts
[R3]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/pokemon-data.ts
[R4]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/exporter/charmap.ts
[R5]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/docs/ai.md
[P1]: https://github.com/pret/pokeemerald/blob/master/src/pokemon.c
[P2]: https://github.com/pret/pokeemerald/blob/master/src/save.c
[P3]: https://github.com/pret/pokeemerald/blob/master/src/load_save.c
[P5]: https://github.com/rh-hideout/pokeemerald-expansion/blob/expansion/1.6.2/include/battle.h
[P6]: https://github.com/visualboyadvance-m/visualboyadvance-m/blob/master/src/core/gba/gba.cpp
