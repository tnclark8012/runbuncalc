# Compact battle state: representation, translation, and measured impact

Research checked 2026-11-17 against repository commit `9fa20e6b693179b431b01f659813c08e8228ea29` and its patched `@smogon/calc@0.11.0`. No ROM, save, RAM dump, disassembly listing, player identifiers, or inventory is included; the snapshot follow-up records only selected battle facts.

## Bottom line

**Yes for retained-state memory and copying; not automatically for whole-search speed.** A plain-data experiment sharing immutable Pokemon definitions used **7.60-7.76 KB per state versus 18.58-18.74 KB** for current rich state clones, about **59% less retained heap**. Copying was about **49-55 times faster**. However, materializing calculator objects introduces work, and the calculator still clones them internally. A real-turn probe was dominated by CPU move scoring, not state copying. These are local desktop measurements of specific fixtures, not a production compact engine or Android/search benchmarks. Section 7 gives the methodology and limitations.

**Recommended direction:** a versioned, ROM-informed **plain-data state**, with shared immutable roster/dex definitions, numeric IDs, party-slot references, active battler overlays, and explicit timers/history. Keep rich Smogon objects as short-lived calculation requests. Do not copy the ROM ABI literally or pack every byte before measuring. A small storage adapter can reduce retained memory, but meaningful copying savings require transitions to operate on the plain state rather than repeatedly reconstructing the entire `BattleFieldState`. See sections 5-8.

## What “ROM-like battle state” actually means

The engine does **not** keep a whole battle in one `BattlePokemon` structure. It separates persistent party records, active battler records, battler-to-party mappings, status bitfields, restriction counters, side/field timers, delayed effects, history, action ordering, and execution state. A compact application representation can follow those divisions without copying their encryption, pointers, compiler padding, or graphics/controller machinery. This is a design inference from the owning declarations, not a claim that one upstream structure exactly matches Run & Bun. [E-battler; E-restrictions; E-sides; E-globals; E-execution]

In particular, copying only the active battlers would lose the bench and conditions needed after a switch; copying only the parties would lose effective battle species/types/ability, boosts, volatile conditions, and history. Exact continuation at an arbitrary animation/instruction boundary is a different problem from simulating a turn from an established decision boundary. [E-battler; E-globals; E-execution; R-live]

## Evidence levels and attached build

| Evidence | What it establishes |
| --- | --- |
| Attached ROM, inspected locally in this investigation | 33,554,432 bytes; SHA-256 `68ec5b0c02e6def8da8dc2b1857b269505418803d44cc2b816fb7471587bf89d`; GBA header title `POKEMON EMER`, game code `BPEE`, revision byte `0`. These inherited header fields do not identify the hack version. |
| Targeted local cross-checks against earlier research | The 128-byte region starting at prior RNG address `0x0808BE0C` contains the seed address and both LCG constants reported below. The 128-byte region at prior initialization address `0x08094A98` contains all three reported save/storage pointer addresses. The first-species base-stat entry at the prior species-table address matches Bulbasaur. These corroborate specific anchors, **not** every previously decoded structure or an exact source-build match. |
| Earlier local decoder investigation | Saved-party/PC and selected live-battle layouts were checked against executable readers/writers and supplied saves/snapshots. Those private snapshots were unavailable for the initial pass; the separately supplied `.jg9` was subsequently decoded as documented below. Earlier findings outside that bounded check remain cited prior evidence. [R-scope; R-records; R-live] |
| Newly supplied `.jg9`, inspected locally | Gzip decompression, RAM mapping, four selected party-record checksums, active/party correspondence, stages/types/HP, and nonzero Encore/protection-use history were checked directly. See the supplied-snapshot subsection; this is one sample, not universal format or phase validation. |
| Pinned public Emerald / expansion source | Authoritative for those source revisions; useful mechanisms and structural comparisons, **not** automatically the attached hack's ABI. |
| Maintainer-published Run & Bun dex data | Supplies species/form definitions and static battle data, but is not a complete battle-engine source tree or a proven source match for this binary. [D-species; D-moves] |

The local cross-checks read only those targeted ROM regions and the header; the ROM was never uploaded. No full executable reversal or emulator integration was attempted.

### Prior-art discovery

Read [#114](https://github.com/tnclark8012/runbuncalc/issues/114), its [decoder-resolution comment](https://github.com/tnclark8012/runbuncalc/issues/114#issuecomment-6941390913), and [#125's agreed contract](https://github.com/tnclark8012/runbuncalc/issues/125#issuecomment-6941028893). Paginated GitHub branch enumeration and `git/matching-refs/heads/investigations` returned no current `investigations/state-parser` branch. The consolidated decoder findings survive at commit `0b1647a9a978d6aa20008ec38c2a91a14e6a4647` on `research/john-gba-import-paths`; that is the cited prior art, not a silently substituted generic Emerald parser. [R-scope]

### Supplied snapshot validation (follow-up)

**Local primary evidence:** the newly supplied `.jg9` is 63,217 bytes, SHA-256 `9a1969dc430b1a43c6f503df4f46150f351d24f223cb9857947627df96f78aae`. Python 3's standard-library gzip decoder successfully inflated it to **740,238 bytes**, with leading little-endian version value **10**. Applying the previously established mappings, `EWRAM file offset = 0x85DF + address - 0x02000000` and `IWRAM file offset = 0x01DF + address - 0x03000000`, produced four checksum-valid selected party records and the correspondences below. No private input or decoded identity/inventory dump was written to the repository or uploaded. [R-inputs]

The battler-count byte is **4**, and battle-type flags are **`0xD`**. The selected party slots are `[0,0,1,1]` for battlers `0..3`, consistent with the earlier player `0,2` / CPU `1,3` doubles mapping. Species labels agree with the pinned maintainer constants, including Galarian Articuno `905 + 77 = 982`; this independently matches the supplied session-history hypothesis rather than assuming it. [R-live; D-sample-species]

| Battler | Side / zero-based party slot | Species ID / interpretation | Level | Current/max HP | Raw type bytes |
| --- | --- | --- | --- | --- | --- |
| 0 | Player / 0 | 730 / Primarina | 95 | 275/275 | 11,18,9 |
| 1 | CPU / 0 | 727 / Incineroar | 99 | 327/327 | 10,17,9 |
| 2 | Player / 1 | 565 / Carracosta | 85 | 246/246 | 11,5,9 |
| 3 | CPU / 1 | 982 / Galarian Articuno | 99 | 317/317 | 14,2,9 |

Type bytes agree with Water/Fairy, Fire/Dark, Water/Rock, and Psychic/Flying; third-type value **9** matches the public engine's `TYPE_MYSTERY` sentinel, not a third ordinary combat type. The numeric observations are direct sample evidence; type interpretation additionally uses the pinned definitions. [E-sample-ids]

| Battler | Raw Atk / Def / Spe / SpA / SpD | Raw Attack stage | Last-move ID | First-turn-out byte |
| --- | --- | --- | --- | --- |
| 0 | 175 / 150 / 109 / 283 / 252 | 5 | 227 | 0 |
| 1 | 263 / 213 / 169 / 174 / 213 | 6 | 252 | 0 |
| 2 | 215 / 248 / 80 / 151 / 114 | 5 | 182 | 0 |
| 3 | 182 / 203 / 245 / 283 / 233 | 6 | 749 | 0 |

Every other stage byte is **6**. Thus both player Attack stages translate to **-1**, while the CPU Attack stages are neutral. For each of the four selected party records, decryption/checksum validation passed, and species, moves, current PP, all five raw stats, HP/max HP, level, and major status matched the corresponding active record. In particular, the player's raw Attack values still equal their party stats despite the nonneutral stage: applying stages to those values and then also passing the stage to a calculator would double-apply the reduction. This directly supports storing raw stats and stages separately. No transformed/type-changed specimen was exercised. [R-records; R-live; E-sample-ids]

**Nonzero history/restrictions:** Incineroar has Encore move **252** (Fake Out), stored move slot **3**, matching its fourth active move. Its packed timer byte is **`0x32`**: the previously traced low-nibble countdown is **2**, **not 50**; the high nibble is not interpreted here. Carracosta's protection-use history is **1**; the other three battlers' counters are zero, and Carracosta's last-move ID **182** is Protect. Primarina's last-move ID **227** is Encore. All first-turn-out bytes are zero. These observations positively confirm the earlier Encore/Protect-history hypothesis for this supplied file. [R-restrictions; E-sample-moves]

**Limits:** all four major/volatile status words, weather flags, field flags, and both side flag words read zero at the documented anchors; this is not a nonzero test of those layouts. The **current-turn Protect shield is not independently established** by this bounded check: the reported cleared shield remains unverified, and history `1` must not be promoted to either an active shield or proof of its absence. Snapshot execution phase, remaining transient blocks, and complete suppression/delayed effects were not decoded. No benchmark was rerun.

**Impact:** this sample strengthens the recommendation for numeric party references, active overlays, separate raw stats/stages, and explicit packed-counter translation; it **does not change** the plain-data representation recommendation or the measured performance conclusions in sections 5–8.

## 1. Three different Pokémon representations

### Persistent boxed and party records

The prior Run & Bun investigation establishes **80-byte `BoxPokemon`** and **100-byte party `Pokemon`** records. The box header contains personality, original-trainer ID, encoded names/flags, and checksum; its final 48 bytes hold four permuted, encrypted 12-byte substructures. Decrypt words with `personality XOR otId`, select substructure order with `personality % 24`, and verify the decrypted halfword checksum. Encryption/permutation is a persistence concern, not something a search-state clone needs to repeat. [R-records; P-box]

| Decrypted substructure | Battle-relevant data |
| --- | --- |
| Growth | Species/form ID, held item, experience, PP bonuses, friendship, changed-nature field |
| Attacks | Four move IDs and four current PP values |
| EVs/condition | Six EV inputs, followed by non-battle contest data |
| Misc | IV inputs and ability-slot selection, among other met/ribbon data |

These are established Run & Bun fields, not permission to copy generic Emerald bit packing: this hack's IV shifts are **1, 6, 11, 16, 21, 26**; the changed nature occupies the low five bits of Growth byte `+0x0A`, with **26** selecting `personality % 25`; ability-slot selection uses bits 29–30 of Misc word `+0x08`. Generic Emerald differs. [R-records; P-substructs]

Party-only suffix:

| Record offset | Data |
| --- | --- |
| `0x50` | `u32` major status |
| `0x54`, `0x55` | Level, mail |
| `0x56`, `0x58` | `u16` current HP, max HP |
| `0x5A`, `0x5C`, `0x5E`, `0x60`, `0x62` | `u16` Attack, Defense, Speed, Sp. Attack, Sp. Defense |

Box records do not have that suffix. The earlier executable trace verified that boxed-to-party conversion clears status and reconstructs HP/stats; current move PP survives the copied box record. That is a specific game conversion rule, not evidence that arbitrary imports or planning actions may heal Pokémon. [R-records; R-box]

### Effective active battler (`BattlePokemon`)

Prior local evidence locates the active array at `0x020233FC`, stride **`0x5C` / 92 bytes**. Its checked layout is: [R-live]

| Offset | Data | Translation concern |
| --- | --- | --- |
| `0x00` | `u16` current species/form | Can differ from original party identity |
| `0x02..0x0A` | Five `u16` battle stats, Atk/Def/Spe/SpA/SpD | Preserve effective values rather than blindly rebuilding from species |
| `0x0C..0x13` | Four `u16` move IDs | Active moves can differ from party moves |
| `0x14` | Packed IV/ability-number data | Not fully decoded in the prior investigation |
| `0x18..0x1F` | Eight stage bytes, neutral **6** | Convert stage encoding to the calculation API's encoding |
| `0x20` | `u16` current ability | This is an ability ID, not an ability-slot index |
| `0x22..0x24` | Three type bytes | Retain changes/additional type, not just species defaults |
| `0x25..0x28` | Four current PP bytes | Do not refill when translating |
| `0x2A`, `0x2C`, `0x2E`, `0x30` | Current HP (`u16`), level (`u8`), max HP (`u16`), current item (`u16`) | Different offsets from party records |
| `0x50`, `0x54` | Major and volatile status words | Not a complete set of battle conditions by themselves |

The expansion declaration has the same broad fields but misleading offset comments around unaligned `u16`/`u32` members. For example, a `u16` cannot simply be assumed to start at the comment's `0x29` under the normal aligned ABI; prior data checks establish HP at `0x2A` here. Do not generate a binary decoder from those comments. [E-battler; R-live]

The remaining bytes contain identification/presentation-related data in public source; they are not all necessary for a damage call. Conversely, shrinking to the damage-call fields alone would not preserve all battle-transition inputs. [E-battler; E-restrictions; E-execution]

### Party selection and identity

Prior anchors are player party count `0x02023A95`, live player party `0x02023A98`, enemy party `0x02023CF0`, and active party indices at `0x020233E6 + 2*b`. Its checked doubles convention is player battlers `0,2`, CPU `1,3`. Keep explicit side/position/party-slot links; a battler is a temporary active position, not an owned individual. Public source also exposes `gBattlerPositions` independently of party indices. [R-anchors; R-live; E-globals]

Do not count active item records as extra owned items. Do not overwrite effective ability/type/item/move changes with party defaults when materializing a calculation request. Personality plus original-trainer ID supports identity matching but is not collision-proof in cloned records. [R-identity; R-items; R-tables]

## 2. State outside active battlers

### Restrictions, current-turn results, and history are distinct

Earlier research located a **40-byte per-battler restriction/counter block** at `D = 0x02023668 + 40*b`. Positively checked fields include Encore move (`u16 D+6`), protection-use history (`D+8`), Encore slot (`D+0x10`), Encore countdown (low nibble `D+0x11`), and first-turn-out (`D+0x19`). Executable-read evidence, without positive effect samples, additionally supports Disable timer (low nibble `D+0x0F`), Taunt timer (low nibble `D+0x16`), and Truant phase (`D+0x1A`, bit 0). [R-restrictions]

The public `DisableStruct` shows why a timer-only status list is insufficient: transformed identity, disabled/encored moves, protection-use counter, stockpile boosts, Substitute HP, recharge, trapping source, and numerous timed effects are separate members. **Its packing is not the verified Run & Bun layout:** for example, the public declaration puts transformed OT ID before disabled/encored moves, unlike the earlier observed Encore/protection offsets. Copy semantic concepts, not that struct's offsets. [E-restrictions; R-restrictions]

Public `ProtectStruct` holds the **current-turn** shield/Helping Hand flags and damage/source information; `SpecialStatus` holds other transient damage, survival-item, redirection, and switch-in effect information. The earlier Run & Bun investigation did **not** finish mapping those actual blocks. Protection-use history must not be used as the current Protect shield, and last turn's flinch must not become this turn's flinch. [E-protect; E-special; R-restrictions]

Other history to preserve when applicable:

- Last-used move at `0x020235CC + 2*b`, with `0xFFFF` treated as a sentinel, not a move. Additional status arrays at `0x02023648 + 4*b` and `0x02023658 + 4*b` remain only partly classified. [R-live]
- Public globals distinguish last move, last landed/resulting move, locked move, last attacker/type, selected move, and current move. They are not interchangeable. [E-globals]
- Public `BattleStruct` separately stores Choice-lock moves, used held items per party member/side, trapping source/move, switch targets, and previous HP. Public `BattleHistory` stores AI-observed abilities, items/effects, used moves, and recent move history. A simulator needing the ROM AI's information boundary must not conflate this with omniscient actual state. Exact attached-build layouts/coverage for all these members remain unverified. [E-execution; E-history; R-ai]

### Sides, field, and delayed effects

Prior executable-grounded anchors, **not fully validated by nonzero samples**, are: [R-field]

| Address | Data |
| --- | --- |
| `0x02023610 + 4*side` | `u32` side flags |
| `0x02023618 + 24*side` | Side timer/layer block |
| `0x020237C8` | `u16` weather flags |
| `0x02023A58` | `u32` field flags |
| `0x02023A5C` | Field timers |

Recorded side-relative offsets include Reflect `+0/+1` timer/battler, Light Screen `+2/+3`, Mist `+4/+5`, Safeguard `+6/+7`, Spikes `+8`, Toxic Spikes `+9`, Stealth Rock `+0xA`, Sticky Web `+0xB`, Aurora Veil `+0xD/+0xE`, Tailwind `+0xF/+0x10`, and Lucky Chant `+0x11/+0x12`. Leave `+0xC` and `+0x13..0x17` uninterpreted rather than assuming the upstream arrangement. Public expansion has extra Sticky Web bookkeeping and correspondingly different later offsets. [R-field; E-sides]

The public `FieldTimer` separates Mud/Water Sport, Wonder/Magic/Trick Room, terrain, Gravity, and Fairy Lock durations. Earlier ROM checks corroborate Wonder Room `+2`, Magic Room `+3`, Trick Room `+4`, and Gravity `+6`; other timer positions remain hypotheses. Conditions require both their flags and relevant remaining durations, not merely a current weather/terrain string. [R-field; E-sides]

Public `WishFutureKnock` separately keeps Future Sight counters/attacker/move, Wish counters/party ID, weather duration, and knocked-off party masks. This demonstrates additional required concepts, **not** verified Run & Bun offsets or complete modern delayed-damage semantics. Actual weather duration, Wish/Future Sight layout, and complete suppression/consumption/volatile details remain follow-up work. [E-delayed; R-field]

### PRNG and turn phase

Prior executable tracing identifies RNG seed address `0x03005D90` and function `0x0808BE0C`:

```text
seed = (seed * 0x41C64E6D + 0x6073) modulo 2^32
result = seed >> 16
```

This investigation locally corroborated those constants/address near the reported function, without publishing any seed. The same recurrence and upper-halfword return exist in public Emerald source. A seed is useful for deterministic tracing only with correct phase, call order, and all intervening random draws; it is not needed to represent an explicit distribution of alternative outcomes. [R-rng; P-rng; P-rng-header]

For arbitrary snapshot continuation, public engine state also contains turn-order arrays, current action/actor/target, chosen moves/actions, controller execution flags, script instruction pointers, callback stacks, and effect trackers. A flat list of battlers cannot encode a half-finished move. For a planning model, defining a normalized decision boundary can deliberately exclude rendering/execution machinery, but it must finish any pending effects and establish which choices/history are already committed. This is an architectural implication, not a completed snapshot-phase decoder. [E-globals; E-execution; E-history; R-followup]

## 3. What the translation boundary needs to retain

The following is a ROM-informed adapter contract, not a selected application schema or a claim that Smogon currently accepts every value directly:

1. **Decode once at import.** Convert encrypted party/boxed data into numeric facts and retain source/provenance separately. Keep static species/move/item/ability tables outside per-turn state. The earlier table anchors are species info `0x083B7CE0` (36-byte entries), move data `0x083B0C5C` (20-byte entries), and item data `0x08678D60` (44-byte entries). These are ROM-specific, not portable API enums. [R-records; R-tables]
2. **Link roster plus active overlays.** Materialization starts with the selected party member's stat inputs/nature/identity and overlays effective active species, stats, HP/status, moves/PP, ability, item, types, and boosts. Maintain the bench's mutable HP/status/PP/items too. The representation must explicitly decide which copy is authoritative for each field at its normalized phase. [R-records; R-live; E-battler]
3. **Translate IDs deliberately.** Use mappings scoped to the game's data revision for species/forms, moves, items, abilities, types, and natures. The maintainer's species constants put base species through Enamorus at 905 and start forms afterward; Mega Venusaur is therefore 906 in that source, not a universal National Dex or sprite ID. This is public-source evidence, not proof of the attached binary's complete enum table. Keep unknown IDs explicit. [D-species]
4. **Distinguish ability slot from effective ability ID.** Party ability selection indexes the species' three `u16` abilities, including the verified zero-entry fallback; active `ability` is already the current effect's numeric ID. The existing Lua exporter independently demonstrates party-slot selection and the nature sentinel. [R-tables; R-exporter]
5. **Convert encodings, not meanings.** Decode engine stage neutral 6 into signed stages where required; map stat indices/order explicitly; decode major status while retaining sleep/toxic counters when relevant; keep volatile duration/source data that a damage request itself does not consume. Preserve the Run & Bun IV/nature packing and current PP. Status masks beyond those checked in the earlier report remain hypotheses, not a verified bitfield contract. [R-records; R-live; R-status]
6. **Project the requested calculation context.** Select attacker/defender plus the applicable side/field and, in doubles, partner effects. Keep history, move restrictions, future effects, and phase in the compact simulation state even when a particular damage call does not accept them. Resolve names/static definitions at this boundary, rather than duplicating display strings and dex objects in every ROM-like record. This is a design inference from the engine's separation of state, not measured evidence about the local calculator. [E-battler; E-sides; E-delayed; E-globals]

Do not preserve encryption merely for authenticity, copy raw pointers as durable references, identify Pokémon by slot alone, refill PP, assume unknown timers are zero, or rebuild away in-battle ability/type/stat changes. Those shortcuts discard information established above.

### Structural size evidence, not a performance result

Known ABI payloads are small: twelve party records are **1,200 bytes**, four active records **368 bytes**, four checked restriction blocks **160 bytes**, and two side flags/timer blocks **56 bytes**. Their sum, **1,784 bytes**, is only a **partial raw-byte subtotal**, not a complete battle snapshot or a proposed allocation size. It excludes additional statuses, field/delayed effects, histories, identity/provenance, phase, and any runtime/container overhead. Duplicated party/active fields and presentation data also mean a purpose-built representation need not copy even this subtotal literally. [R-records; R-live; R-restrictions; R-field]

These facts establish that a compact numeric representation is plausible. They do **not** establish its JavaScript heap footprint, cloning cost, damage-adapter allocation cost, or search speedup. Those require local simulator measurements, not comparisons between C `sizeof` values and JavaScript object counts.

## 4. What ordinary progress saves cannot supply

An in-game save stores persistent party/storage/progress data, not a suspended running battle. Public save/load code explicitly copies between the live party and SaveBlock1; the earlier Run & Bun investigation verified the analogous copy routine and warns that a snapshot's saved-party copy can lag the live party. A progress save therefore cannot establish current opponents, active positions, volatile conditions, side/field effects, last moves, turn phase, or the running PRNG merely because party data is readable. Do not report those absent live observations as neutral/zero or infer “no battle underway.” [P-party-copy; R-anchors; R-contract]

An emulator snapshot can contain those live facts, but **not yet decoded** is different from **not stored**. Earlier John GBA mapping/decompression findings are sample-specific; the supplied-snapshot follow-up above positively checks one additional file using that mapping, not a universal container format or complete live-state decoder. A compact normalized state can be populated manually or from a verified importer without becoming an emulator save-state format. [R-inputs; R-contract]

## 5. What is expensive about the current representation

`BattleFieldState` itself is small: two trainers, a field, and a turn number. Its **reachable object graph and reconstruction behavior** are the relevant costs:

| Current mechanism | Consequence for a lighter representation |
| --- | --- |
| Each active `PokemonPosition` and each benched party entry owns a rich Smogon `Pokemon`; trainer clone copies both lists. | Factor immutable roster inputs away from mutable per-node facts; do not retain full dex/species objects for every branch. [S-contract] |
| `BattleFieldState.clone()` clones both trainers and the field. Trainers also construct a switching-strategy object with a closure. | Keep behavior/policies outside serialized state. Use stable side/party references instead of rebuilding behavioral objects. [S-contract; S-party-policy] |
| Patched `Pokemon.clone()` calls the constructor, which deep-copies species data and reconstructs six stats; it also copies IVs, EVs, boosts, and moves. | This is not a cheap shallow object copy. A simple record copy can avoid repeated constructors even without a byte-packed schema. Generation tables are already shared, so the baseline is not duplicating the entire dex per Pokemon. [S-package; S-patch] |
| `runTurn`, `startTurn`, action execution, visitors, and end-turn handling clone state/Pokemon repeatedly. | Changing the outer class or serialization alone will not remove those internal allocations. [S-turn; S-execution; S-visitor; S-move-execution] |
| CPU-facing field access constructs an oppositely oriented `Field`. | An adapter needs an explicit attacker side, not a globally fixed player-as-attacker interpretation. [S-contract] |
| Action logs refer to trainers, Pokemon positions, rich actions, and moves. | Compact states will not realize their full graph-level memory saving if history continues to retain the old rich graph. Keep lightweight action IDs/parent links for presentation and retain only mechanically relevant history inside the state. [S-actions; S-path] |

This is also more than a persistence DTO change: speed checks, switch logic, AI scoring, and effects currently call methods such as `hasAbility`, `hasItem`, `curHP`, and `equals` throughout the simulator. The main migration is moving those consumers onto state records plus shared lookups, not replacing one constructor. [S-utils; S-scoring; S-move-execution; S-switch]

## 6. Proposed boundary and concrete translation

This is a **design proposal**, not an implemented schema or a decision to support every ROM mechanic immediately.

### Separate definitions, mutable facts, and presentation

| Layer | Contents | Lifetime |
| --- | --- | --- |
| Battle definition | Rules/data revision, species/move/item/ability mappings; roster identity, original species, level, nature, IVs/EVs, original move set; policy configuration | Shared by every branch of one battle |
| Mutable party records | Current HP, major status and counters, current item, PP, mechanically relevant consumption/history | One record per actual team member, including active members |
| Active overlays | Party reference, effective species/form/ability/types/moves/stats when changed, stages, first-turn flag, volatile counters/sources, per-turn flags | Up to four battlers; never an extra owned Pokemon/item |
| Side/field state | Conditions, layers, durations, delayed effects, party-wide consumption/mega-use restrictions | Copied or structurally shared with each node |
| Decision/execution context | Normalized phase, turn, mechanically relevant last/locked moves and AI knowledge; optional deterministic PRNG state | Only facts that influence subsequent transitions |
| Search/presentation envelope | Parent/action references, probability, search budget/evidence, display text | Not part of damage inputs; separate from semantic battle equality |

Within the model, choose **one authoritative owner** for overlapping party/active fields at a normalized decision boundary. For example, party records can own HP/status/item while active overlays own effective types/stages and temporary stat/move overrides. A ROM importer reconciles the engine's duplicated records once; search transitions must not carry two independently mutable HP values. This division follows the ROM concepts in sections 1-3 but is intentionally not its wire format.

A compact shape could therefore look like this, with details to be finalized against supported mechanics:

```text
BattleDefinition (shared)
  rulesRevision, idMappings, roster[side][partySlot], policies

BattleSnapshot (per node)
  schemaVersion, phase, turn
  party[side][partySlot] -> hp, itemId, status/counters, pp, consumption
  active[battler] -> side, partySlot, stages, effectiveOverrides, volatiles
  sides[side] -> flags, layers, timers, delayed effects
  field -> weather/terrain/room flags and durations
  history -> last/locked/choice moves, relevant sources, AI knowledge
```

Species, move, item, and ability numbers need not be the same integers internally as in ROM. A build-scoped mapping at import is safer than making ROM enum values universal application IDs. Use explicit absence/unknown representations; an unknown imported condition is not the same thing as its inactive state. For byte packing later, unsigned status words, signed stages, alignment, and array-buffer overhead must be measured explicitly.

### Project a calculation request, not the entire battlefield

```text
snapshot + battle definition + attacker slot + defender slot + selected move
    -> resolve identity and current effective values
    -> materialize attacker Pokemon + defender Pokemon
    -> materialize oriented Field/Side and context-specific Move
    -> calculate(configured generation, attacker, defender, move, field)
    -> consume damage results as calculation outputs
```

The transition engine, not the damage result, remains authoritative for PP use, move restrictions, status durations, switching, consumption, and history. Recoil/recovery and multi-hit follow-up calls need the updated state between hits, just as the current `executeMove` does. [S-move-execution]

| Compact/ROM fact | Calculator projection |
| --- | --- |
| Species/form ID | Resolve to the configured species name/definition, including hack-specific overrides; preserve stable individual identity separately. |
| Level, nature, IVs/EVs | Constructor options using the game's stat order mapped to `hp/atk/def/spa/spd/spe`; do not swap Speed with Sp. Attack. |
| Current HP, major status, toxic counter | `curHP`, status name, `toxicCounter`; preserve zero HP. Keep sleep and other restriction counters in simulator state even if not accepted by calc. |
| Current held item and effective ability | Resolve names, pass `item`, `ability`, and context-dependent `abilityOn`; consumption is not permission to restore the roster's original item. |
| Active stage bytes | Convert neutral 6 to signed stages, then populate `boosts`. Accuracy/evasion remain simulation inputs, not invented damage stats. |
| Current effective types/weight/stats | Preserve changes, not just species defaults. See the important cloning limitation below. |
| Move ID plus current actor context | Resolve name and use the equivalent of current `createMove`, which supplies ability/item/species. Add hit/critical/repetition options where required. `PP` is a legality/transition input, not a damage-constructor option. [S-scoring] |
| Weather/terrain and side/partner conditions | Project `Field` and both `Side`s in attacker orientation; retain remaining timers in snapshot state. Derive doubles partner effects from the applicable active partners. [S-contract; S-package] |

The simulator currently selects **generation 8**, despite running against a GBA game. Keep that configured rules/data layer; ROM hardware does not imply using Smogon's generation-3 calculator. Mapping IDs or storing ROM-shaped records does not establish Run & Bun damage/AI fidelity. [S-config; S-package]

### Important calculator limitations

1. **`calculate` clones both Pokemon, the move, and field internally.** Lazy hydration does not eliminate those allocations; it adds initial materialization before them. Do not mutate cached input objects or assume the calculation executes directly on them. Per-evaluation request reuse can avoid rebuilding the same pair four times, but any cache must include every effective calculation input and be bounded. [S-package]
2. **Assigning effective stats before calling `calculate` is not sufficient.** The installed patched `Pokemon.clone()` reconstructs stats from species/IVs/EVs/level/nature; it does not preserve arbitrary `rawStats`, `stats`, or current `weightkg` assignments. A local probe gave `normalAtk=130`, `assignedAtk=999`, `clonedAtk=130`. Thus an importer that copies live battle stats into `pokemon.rawStats` and then calls `calculate` silently loses them. Ordinary roster-derived values can use normal construction. Genuinely changed/imported effective values require a project-side, clone-preserving adapter (for example a properly typed Pokemon subclass whose `clone` reapplies independent effective stat/weight copies), or a demonstrated equivalent using supported species overrides. That adapter must survive **the calculator's own clone**, not just the first constructor. Do not bypass `calculate` via internal mechanics functions or alter `calc` as a shortcut. [S-package; S-patch]
3. **Not every ROM field has a direct API counterpart.** Public Pokemon options support one or two types, not a fully general three-type battler; PP, accuracy/evasion stages, many timers/history fields, and in-progress execution also lie outside this damage API. Unsupported contexts must be handled by the simulator or rejected explicitly, never silently truncated. Effective ability suppression and partner effects also need rule-aware projection rather than raw bit copying. [S-package; E-battler]
4. **Preserve identity across materialization.** The local patch adds stable `id`/`equals`; absent an explicit ID, construction generates a random ID. Rehydrating the same Pokemon must not create a new logical individual. [S-patch]

## 7. Measured memory and performance

### Method

An isolated experiment used the **actual current `BattleFieldState`, `Trainer`, `PokemonPosition`, and patched Smogon package**, not a hand-written imitation of their clone behavior. It compared them with plain records factoring immutable Pokemon construction data into **twelve shared templates**. Each record still copies current HP/status/item/ability/types/boosts/raw stats/stats/moves and relevant calculator toggles; fields/sides, first-turn state, and volatile objects are copied too. This is deliberately simpler and less compact than a finished numeric/packed format.

Environment: Windows x64, Intel Core i9-12900K, Node **22.16.0**, `@smogon/calc` **0.11.0**, existing repository patch applied. Two synthetic full-roster fixtures use twelve total Pokemon: singles has one active plus five benched per side; doubles has two active plus four benched per side. They include Rain, Reflect, Stealth Rock, held items, and a volatile flag. A four-move calculation batch is **one attacker/defender pairing**, including in doubles; it is not every doubles target/partner/action combination.

Timing uses five samples after warmup and a discarded full initial suite to reduce JIT bias: 3,000 operations/sample for clone/hydration, 1,500 for damage batches. Table entries are sample medians. Retained memory uses three separately allocated sets of 3,000 live cloned states, forced GC before/after, and median `heapUsed` delta per state. External-memory deltas were negligible for these object-only variants. Shared templates/dex, history, retained damage results, UI, and search caches are excluded. Both variants share immutable construction inputs appropriately; rich clones still perform their real constructor/species allocation.

Assertions check the fixtures' active/party Pokemon, field, and turn round-trip, all four damage outputs, distinct identity, and isolation when changing HP/boosts/item, including fainted HP `0`. This is evidence for these fixtures, **not an exhaustive semantic equivalence test**: transformed stats, arbitrary custom policies, all volatile mechanics, import decoding, and third-type handling are not implemented or validated by the experimental adapter.

Reproducible scripts and raw JSON outputs are delivered with this investigation:

```powershell
# Run from this repository after npm ci, using Node on PATH.
node --expose-gc <downloaded-artifacts>\battle-state-benchmark.cjs
node --expose-gc <downloaded-artifacts>\battle-turn-probe.cjs
```

The scripts transpile the existing TypeScript modules in memory. They do not change production code or `calc`. Artifact names are `battle-state-benchmark.cjs`, `battle-state-benchmark-results.json`, `battle-turn-probe.cjs`, and `battle-turn-probe-results.json`.

### Results

KB below means **1,000 bytes**, not KiB. Timing is microseconds per operation.

| Operation | Singles rich | Singles plain | Doubles rich | Doubles plain |
| --- | ---: | ---: | ---: | ---: |
| Retained heap/state | 18.58 KB | 7.60 KB | 18.74 KB | 7.76 KB |
| State clone | 129.19 us | 2.65 us | 131.17 us | 2.38 us |
| Materialize a full rich state from plain | n/a | 136.57 us | n/a | 141.98 us |
| Four damage calculations, already-rich pair vs hydrate pair once | 177.27 us | 203.96 us | 175.82 us | 207.57 us |
| Synthetic branch: clone state + four calculations | 314.15 us | 206.76 us | 317.64 us | 206.68 us |

Interpretation:

- **Memory: meaningful if many nodes remain live.** About **59% less retained state heap**, or roughly **2.4 times as many state bodies** in the same budget, before histories/caches. A linear projection for 100,000 retained states is about **1.86 GB versus 0.76 GB** in singles; that scale was **not allocated/measured** and would still be expensive. A few interactive states would save little absolute memory.
- **Pure copying: substantially cheaper.** About **49-55 times faster** in this experiment, mostly by avoiding rich reconstruction, not from bit packing.
- **Damage alone: modestly worse with hydration.** Materializing the pair once added about **15-18%** to this four-call batch. Hydrating the same pair again for each move would be a worse boundary. Calculator-internal clones remain.
- **Copy-heavy work can benefit.** The synthetic clone-plus-calc batch was about **34-35% faster** with plain storage. This assumes only the two needed Pokemon are materialized and the transition itself does not demand the whole rich state. It is **not a measured `runTurn` or search speedup**.
- **Wrapping the old engine is different.** A plain clone plus full hydration costs approximately as much as, or a little more than, the current rich clone, before paying for the old engine's internal clones. Storage-only conversion may reduce retained memory but is not the demonstrated faster execution path.

### Real-turn probe: why a search-speed claim would be premature

A separate probe ran current **unmodified `runTurn`** with twelve total Pokemon in singles, a fixed player Ice Beam, and four CPU damaging moves. It produced two outcomes with total probability 1. Its repeated uninstrumented median was **70.95 ms** (samples **67.83-85.72 ms**); exact samples are preserved in the raw output.

An additional instrumented execution counted **25 full-state clones, 484 Pokemon clones, 47 Field clones, 12 damage calculations, and one CPU-scoring call**. The timers are inclusive and overlap: Pokemon cloning includes clones inside state and damage work, so they cannot be summed as independent costs. That execution took **64.85 ms**, including **60.32 ms in CPU move scoring** and **3.30 ms across Pokemon cloning**. These attribution timings are a single instrumented execution, not a second statistically isolated benchmark; they cannot be directly subtracted from the separate uninstrumented median.

This is consistent with `scoreCPUMoves` enumerating the Cartesian product of damage rolls across available moves: four 16-roll entries mean up to **65,536 tuples** before considering battle-action branching. The local seen-roll cache saves repeat scoring but still visits the product. A lighter state does not reduce that enumeration or the number of turn/search outcomes. Therefore the measured fast record copy cannot honestly be presented as a similar whole-solver speedup. Other encounters may have different bottlenecks. [S-scoring; S-utils; S-execution; S-path]

No whole-search migrated implementation, Android measurement, packed-buffer benchmark, peak-RSS comparison, GC-pause profile, or import-to-search fidelity benchmark was performed.

## 8. Impact and lowest-risk adoption

| Approach | Memory potential | Compute impact | Scope |
| --- | --- | --- | --- |
| Keep `BattleFieldState`; optimize cloning/sharing only | Some, especially species/static data | Could reduce current copying without replacing every consumer | Smaller than a new state engine, but mutable aliasing and constructor semantics need care |
| Plain state for storage; hydrate whole state for current `runTurn` | Can reduce retained-node memory if rich logs/results are released | Extra boundary work; internal cloning/scoring unchanged | Useful intermediate storage/import boundary, not a performance solution by itself |
| Plain state is authoritative for transitions; lazy calc-pair projection | Best supported direction from the experiment | Cheap branches; adapter overhead on damage; existing scoring still a separate bottleneck | Meaningful simulator refactor across switching, phases, AI consumers, actions, and UI boundaries |
| Exact ROM byte structs or packed buffers immediately | Potentially smaller payload; actual JS total unmeasured | Cheap bulk copying is plausible, but bit access/adaptation can cost more | Highest coupling to ABI/version and hardest debugging; not justified as the first step |

**Suggested sequence, not implementation performed here:**

1. Establish a normalized action-selection boundary and versioned plain snapshot contract. Keep immutable definitions/policies external; explicitly represent unsupported/unknown imported facts.
2. Build the calculator adapter first against existing supported scenarios. Check effective stats **after internal cloning**, zero HP, stable identity, consumed items, status counters, transformed types/ability, actor-oriented fields, and doubles partner context. Fail clearly where fidelity is not supported.
3. Use plain snapshots for retained state/history and import/export, measuring whether richer graphs are actually released. Keep the current engine as a comparison path during migration.
4. Port one transition slice at a time onto plain records. Initially copy a few small records/arrays; use structural sharing only with an enforced immutability contract. Mutable typed-array views shared by sibling branches are unsafe.
5. Introduce canonical state keys containing **all future-relevant facts**. Current search uses `BattleFieldState.toString()`, whose output omits bench, field, and many active details; copying that key into the new format would merge mechanically different states. Use a key scoped to rules/definition and normalized phase, with collision-safe equality and the search context needed for valid memo reuse. This is a prerequisite for trustworthy new deduplication, not an unrelated hashing optimization. [S-contract; S-path]
6. Measure complete representative turns/searches, retained graph size including logs/caches, peak memory, and target Android behavior. Optimize numeric packing or scoring separately only when those measurements justify it.

The main payoff is **a cleaner simulation/import boundary and substantially cheaper retained states**, not copying the ROM for its own sake. The current evidence supports starting with shared-definition plain records; it does not support promising a large end-to-end search acceleration from storage format alone.

## Sources

All public code links are pinned. “R” links identify the existing local-executable/sample investigation, including its limitations; they are not independent revalidation of private samples.

- Prior investigation, records/import: [R-scope], [R-inputs], [R-anchors], [R-records], [R-identity], [R-tables], [R-box], [R-items], [R-exporter], [R-contract].
- Prior investigation, live state: [R-live], [R-restrictions], [R-field], [R-status], [R-ai], [R-rng], [R-followup].
- Emerald reference: [P-substructs], [P-box], [P-party-copy], [P-rng], [P-rng-header].
- Expansion 1.6.2 reference: [E-battler], [E-restrictions], [E-protect], [E-special], [E-sides], [E-delayed], [E-history], [E-execution], [E-globals].
- Maintainer-published dex data: [D-species], [D-moves].
- Local simulator and package evidence: [S-contract], [S-party-policy], [S-turn], [S-execution], [S-visitor], [S-move-execution], [S-actions], [S-path], [S-utils], [S-scoring], [S-switch], [S-config], [S-patch], [S-package].

[S-contract]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/moveScoring.contracts.ts#L107-L297 "PokemonPosition, Trainer, BattleFieldState and clone/key behavior"
[S-party-policy]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/switchStrategy.partyOrder.ts#L12-L19 "Party-order policy captures trainer lookup"
[S-turn]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/turn-state.ts#L12-L75 "State transforms, clones, and outcome histories"
[S-execution]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/phases/battle/determine-move-order-and-execute.ts#L17-L270 "Action products, state clones, effective state updates"
[S-visitor]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/battle-field-state-visitor.ts#L40-L125 "Default rewriter clones and replacement semantics"
[S-move-execution]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/phases/battle/execute-move.ts#L10-L60 "Per-hit calculation and state mutation/cloning"
[S-actions]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/phases/battle/move-selection.contracts.ts#L10-L50 "Action/history references to trainers, Pokemon, and moves"
[S-path]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/path-finder.ts#L25-L175 "Search storage, histories, memoization keys"
[S-utils]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/utils.ts#L13-L175 "Rich Pokemon operations and Cartesian product"
[S-scoring]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/moveScoring.ts "CPU damage-roll product L10-L80; rich consumers L142-L185; move construction/calculate boundary L798-L830"
[S-switch]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/simulator/phases/switching/execute-switch.ts "Switch transition coupled to rich state"
[S-config]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/src/extensions/configuration.ts#L1-L40 "Configured generation and RNG abstractions"
[S-patch]: https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/patches/%40smogon%2Bcalc%2B0.11.0.patch#L173-L252 "Local Pokemon identity, type, zero-HP, and clone modifications"
[S-package]: https://registry.npmjs.org/@smogon/calc/-/calc-0.11.0.tgz "Primary npm package pinned by package-lock.json L4070-L4077. Installed dist/calc.js L22-L24 clones calculation inputs; dist/pokemon.js L28-L90 constructs species/stats and L182-L212 clones; dist/state.d.ts and dist/pokemon.d.ts define supported input shapes. Local patch applied."

[R-scope]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L1-L39 "Existing decoder research: scope/evidence"
[R-inputs]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L41-L59 "Input kinds and sample RAM mapping"
[R-anchors]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L75-L92 "Persistent/live party and pointer anchors"
[R-records]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L94-L136 "Run & Bun record decoding and suffix"
[R-identity]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L138-L140 "Identity limitations"
[R-tables]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L142-L159 "ROM tables and verified derivations"
[R-box]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L161-L183 "Box storage/conversion"
[R-items]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L208-L212 "Ownership counting"
[R-live]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L214-L251 "Active battler layout and mappings"
[R-restrictions]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L253-L275 "Restrictions, history, and evidence boundaries"
[R-field]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L277-L293 "Weather/field/sides and limitations"
[R-status]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L295-L299 "Status-mask verification boundary"
[R-ai]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L301-L320 "AI resources/history"
[R-rng]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L322-L324 "RNG trace and phase caveat"
[R-followup]: https://github.com/tnclark8012/runbuncalc/blob/0b1647a9a978d6aa20008ec38c2a91a14e6a4647/docs/research/run-and-bun-decoder.md#L326-L346 "Incomplete live-state/phase work"
[R-exporter]: https://github.com/tnclark8012/runbuncalc/blob/fd9a2d41ae108fd2ae5805284cb22863cea1ded5/src/runandbun_script_imports.lua#L4291-L4304 "Existing exporter ability/nature bridge"
[R-contract]: https://github.com/tnclark8012/runbuncalc/issues/125#issuecomment-6941028893 "Agreed source/provenance/live-state contract"
[P-substructs]: https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/include/pokemon.h#L99-L176 "Emerald persistent substructures"
[P-box]: https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/include/pokemon.h#L196-L232 "Emerald boxed/party definitions"
[P-party-copy]: https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/load_save.c#L160-L178 "Emerald live/saved party copying"
[P-rng]: https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/random.c#L8-L16 "Emerald RNG implementation"
[P-rng-header]: https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/include/random.h#L11-L17 "Emerald LCG constants"
[E-battler]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/pokemon.h#L268-L304 "Expansion 1.6.2 BattlePokemon"
[E-restrictions]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L59-L106 "Expansion DisableStruct"
[E-protect]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L108-L156 "Expansion ProtectStruct"
[E-special]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L158-L200 "Expansion SpecialStatus"
[E-sides]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L202-L241 "Expansion side/field timers"
[E-delayed]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L243-L252 "Expansion WishFutureKnock"
[E-history]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L319-L360 "Expansion history/resources"
[E-execution]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L540-L633 "Expansion BattleStruct"
[E-globals]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/battle.h#L928-L999 "Expansion battle globals"
[D-species]: https://github.com/dekzeh/runandbundex/blob/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab/species/species.h#L896-L924 "Run & Bun maintainer dex species/form IDs"
[D-moves]: https://github.com/dekzeh/runandbundex/blob/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab/moves/battle_moves.h#L1-L31 "Run & Bun maintainer dex move records"
[D-sample-species]: https://github.com/dekzeh/runandbundex/blob/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab/species/species.h#L571-L998 "Run & Bun species IDs: Carracosta, Incineroar, Primarina, Galarian Articuno"
[E-sample-ids]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/constants/pokemon.h#L6-L84 "Expansion type IDs and Attack stat index"
[E-sample-moves]: https://github.com/rh-hideout/pokeemerald-expansion/blob/e2811035752b8db36ad8a85be35b72260b5c63b8/include/constants/moves.h#L186-L256 "Expansion move IDs: Protect 182, Encore 227, Fake Out 252"
