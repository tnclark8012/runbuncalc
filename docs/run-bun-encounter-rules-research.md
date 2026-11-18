# Run & Bun encounter rules: documented model and evidence gaps

Research date: 2026-11-18. Intended target: the player's **reported 1.07 campaign**, not a verified build match.

Research for [Establish documented encounter rules for singles, doubles, tag, and back-to-backs](https://github.com/tnclark8012/runbuncalc/issues/136), under [Design an offline-capable Run & Bun battle-planning companion](https://github.com/tnclark8012/runbuncalc/issues/113). This is a bounded documentation inventory, not mechanics certification, production code, a validation campaign, or a search-algorithm decision.

## 1. Result and evidence labels

The strongest version-labelled encounter evidence is the repository's **“Pokemon Run and Bun (1.07) AI document”**: CPU knowledge, move/target scoring, singles switching, and particular doubles interactions. It is the agreed working specification, but explicitly incomplete. It does **not** establish numeric player team limits, tag-partner control, forced-sequence transition scripts, or complete victory/defeat adjudication. [A; E]

An unversioned mirrored **Mechanic Changes** document adds potentially important rules: forced Set style, no bag during trainer battles, pre-battle gym healing, and no restoration of consumed/removed held items. These are explicit claims of that document, **not established 1.07 rules**. Its original author/revision chain and applicability need confirmation. Do not silently promote them to the same evidence tier as the labelled AI reference. [M]

All four formats remain in the intended support domain. Unknown rules are not permission to invent conventional Pokémon behavior, exclude a format, or discard a feasible outcome. A documented-model result must name its assumptions; game-level guarantees remain conditional on unresolved mechanics. [D]

Labels used below:

- **Explicit**: the cited source actually states the claim; this does not mean game-validated.
- **Inference**: a plausible reading or planning implication, not a documented game rule.
- **Not established**: absent or insufficiently specified in the reviewed evidence; not proof that no documentation exists.
- **Product decision**: an agreed planning requirement, not evidence about the game.

## 2. Source register and version boundary

| Key | Source and immutable identity | Authority / version limit |
|---|---|---|
| A | Croven, [repository AI document](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md), blob `75692b00e19d23bcc7082543e0fa456ed96996e4` | Named investigator's primary account, explicitly titled **1.07**. Preamble acknowledges omissions/mistakes. Original publication/revision chain and exact-build correspondence remain unverified. |
| M | [Mechanic Changes](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt), blob `65c8cf0cdc7f02b6c86ef0fd2601cf58cbd7bffa` | Existing evidence inventory's documentation mirror; **unversioned, original authorship not established**. Not first-party implementation proof. Its “assume Generation 8” instruction is a documentation convention, not a complete or validated encounter specification. |
| P | [Post-KO Switch-in AI](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Post-KO%20Switch-in%20AI.txt), blob `0bf41272b4efcb9fa074026a80488e0125c43c15` | Unversioned mirrored account; useful replacement-selection claims, not a complete doubles/tag replacement rule. |
| T | Dekzeh's [calculator trainer data](https://github.com/dekzeh/calc/blob/12ac2532554f220ee02b6573667fe7b55978b4a2/src/js/data/sets/gen8.js), blob `84a735615ac125e6597294d7b42efd16a15a30a4`; [author's calculator README](https://github.com/dekzeh/calc/blob/12ac2532554f220ee02b6573667fe7b55978b4a2/README.md#L1-L5) | Author-published calculator data; README describes R&B stat changes and pre-imported trainers. **No 1.07 attribution established for this revision**. Team labels/data are not encounter scripts. |
| E | [Run & Bun CPU action probabilities and mechanics: primary-source evidence](https://github.com/tnclark8012/runbuncalc/blob/0f096ea5ef1cec87e976d53825985dff86bf350b/docs/run-bun-ai-mechanics-evidence.md), especially §§2–3, 9, 12; [Validate game AI and mechanics evidence for probability claims — resolution](https://github.com/tnclark8012/runbuncalc/issues/124#issuecomment-6970200726) | Previously pinned investigation, reused rather than repeated. Distinguishes documented claims, author data and upstream inference; establishes neither a complete joint transition law nor whole-battle termination. |
| D | [Define the supported ruleset and mechanics-evidence boundary — resolution](https://github.com/tnclark8012/runbuncalc/issues/135#issuecomment-6970546587) | Authoritative **product scope**, not game evidence: reported 1.07, all four formats, sequence-wide risk, equipment allowlist, conditional game guarantees. |
| L | [Define legal team preparation and player control over recommendations — resolution](https://github.com/tnclark8012/runbuncalc/issues/117#issuecomment-6908602775) | Product preparation constraints, retained as amended by D and the subsequent recommendation decisions. A verified trainer-specific team maximum is required; unknown maxima must be flagged. |

Repository instructions, root glossary and the existing [Capacitor/save-access ADR](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/adr/0001-capacitor-app-and-native-save-access.md) were read. The checked-out glossary predates D's sequence/allowlist additions: use D's explicit encounter-wide extension here, without editing domain decisions on a research branch. The ADR does not settle encounter mechanics.

No ROM, proprietary implementation dump, personal save, or emulator state was acquired. No version-matched authorized implementation was established. [Identify the player's exact Run & Bun build without sharing the ROM](https://github.com/tnclark8012/runbuncalc/issues/138) owns local identity; it is **not a blocker for this inventory**.

## 3. Cross-format documented facts and their limits

### CPU knowledge is not player knowledge

- **Explicit, labelled 1.07:** score every move; randomly choose among highest-score ties; doubles scores each move against each possible target and chooses a highest-scoring move/target. AI knows the player's full team's **stats, moves and Abilities at battle start**. [A, lines 10–12](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L10-L12)
- **Not established:** an exhaustive CPU knowledge contract for held items, HP/PP/status of reserves, subsequent changes, player-selected commands, or a tag ally's knowledge. Nor does this grant the player access to hidden CPU choices/RNG or establish what the game UI reveals before each decision. External trainer documentation is not evidence that the game reveals those facts. [A; E §3]
- **Planning implication:** keep actual state, CPU information, and player-observable information distinct. Branching battle plans may use observed outcomes, not leaked internal CPU/RNG decisions. This follows the agreed evidence boundary, not a newly invented game information rule. [D; E §§3, 12]

### Global-looking mechanics claims are not fully specified transitions

The following are **explicit only in unversioned M**:

| Claim | What it does not establish |
|---|---|
| Forced Set battle style; bag inaccessible during trainer battles. [M lines 7–8](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt#L7-L9) | Every command's legality, voluntary/forced replacement choices, tag menus, between-fight menu access, or trainer bag/held-item behavior. Reading Set as “no free shift prompt” is an inference; it is not a ban on voluntary switches. |
| Gym Trainers and Gym Leaders heal the party “to full” before battle. [M line 9](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt#L9) | Which HP, PP, status, fainted members and other fields are restored; ordering relative to team selection; exceptions; healing before non-gym fights or every sequence stage. |
| Entering battle asleep resets the sleep-turn count. [M line 20](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt#L18-L20) | Clearing sleep or resetting every history field; whether a particular sequence transition is a new battle for this rule. |
| Items consumed or removed from the player's Pokémon during battle are not restored. [M line 33](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt#L33-L35) | Complete transfer/ownership rules, special-script exceptions, ally/opponent item persistence, or free replacement berries between fights. |
| Particular locations have permanent weather, terrains or other effects. [M lines 44–53](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt#L44-L53) | That temporary field effects persist across a fight boundary, or that a scripted effect cannot be re-applied/removed. Encounter entry conditions require separate facts. |

No reviewed source supplies a universal numeric **player selection maximum** for any of the four formats. Do not substitute six for singles/doubles or three for tag, or infer the player's limit from an opponent's roster length. L requires a verified encounter-specific maximum and allows smaller teams subject to actual encounter legality; whether a doubles/tag encounter imposes a minimum or eligibility rule is also not established. [L; A; M; P; T]

The sources use “KO” and “faint” without a complete event-order specification. Exact HP-zero/faint adjudication, replacement prompts, flee/forfeit permissions, draw rules and any game-imposed turn limit are not established across the supported formats. Do not import generic rules or add an artificial turn cap. The agreed goal remains **sure eventual victory**, with player faint risk assessed separately; an individual faint, a battle ending and a player victory are different events. [E §9; D]

## 4. Per-format inventory

Each “not established” below refers to reviewed A/M/P/T, with the limitations in §2. Common claims in §3 retain their own version limits in every format.

### Ordinary campaign singles

| Dimension | Evidence / remaining boundary |
|---|---|
| Player/partner control | Choosing the player's own battle actions is the product planning premise [D; L]. A is not a full command/menu specification: legal moves, voluntary switches, trapping, forced replacement options and exceptional restrictions still need encounter/mechanics facts. No partner-control rule is established for ordinary singles. |
| Information | Explicit CPU start-of-battle stats/moves/Abilities knowledge [A lines 10–12]; player observability and CPU knowledge beyond those fields remain not established (§3). Do not expose a chosen CPU action before the player's decision without evidence. |
| Team selection / CPU participation | A describes an active AI Pokémon and eligible reserves, not player roster caps or universal opponent counts. Author data provides particular trainer sets, not rules permitting a player team of the same size [T]. Numeric player maximum/minimum and trainer-specific eligibility: not established. |
| CPU actions / replacement | **Explicit:** ordinary hard switching requires ineffective moves (score ≤ −5), an eligible reserve under the documented speed/survival check and bug, and active HP not below 50%; then a stated 50% switch chance. Perish Song uses an expressly unknown routine. [A lines 26–45](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L26-L45). P line 1 selects the highest post-KO score, ties by party order; its version and detailed eligibility remain unresolved. No “CPU never switches” simplification. |
| Entry / between-fight actions / carry-over | M's gym-heal and item-loss claims are relevant, but not verified 1.07 or a universal full-heal rule. L requires actual HP/status/PP and owned resources, with no assumed consumable preparation. Actions after an independently completed encounter are not automatically actions between forced sequence stages. |
| Faints / victory / encounter end | A/P discuss KOs and bringing in reserves, but do not completely specify faint timing, all-reserve exhaustion, simultaneous last faints, draws, defeat/blackout, or special scripts. A first opponent KO is not evidence of victory. Complete adjudication is not established [E §9]. Any player faint counts toward the agreed encounter-wide faint risk [D]. |

### Campaign doubles

| Dimension | Evidence / remaining boundary |
|---|---|
| Player/partner control | A discusses an AI Pokémon and its allied partner, including partner-targeted moves. It does not establish whether every campaign doubles encounter gives the player both allied command slots, nor exact switch/replacement/menu and targeting legality. Do not conflate an AI's partner with a player-side NPC partner. [A lines 202–237] |
| Information | Explicit move/target scoring and CPU knowledge as above [A lines 10–12]. Some scoring depends on an ally's intended action, e.g. Helping Hand/Follow Me [A lines 272–276](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L272-L276). This is a documented dependency, **not** a complete joint decision order/distribution or evidence the player sees the ally/CPU command. |
| Team selection / CPU participation | The AI document supports allied actors and move/target evaluation, not exact selected-team limits, minimum healthy entrants, one-trainer versus two-trainer party ownership, shared reserves, or refill restrictions. No universal numeric player cap is established. [A; M; T] |
| CPU actions / replacement | **Explicit:** ordinary singles hard-switch routine does not apply; doubles generally does not switch except niche cases such as Perish Song, whose routine is unknown [A lines 26–45]. Ally-directed priority/Weakness Policy interactions and Earthquake partner checks are documented [A lines 218–237](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L218-L237). **Not established:** complete target eligibility/retargeting, ally decision coupling, double-KO replacement order, which trainer supplies a reserve, or Perish Song cases. P's single-opponent wording does not resolve them. |
| Entry / between-fight actions / carry-over | §3's M claims remain tentative, including gym healing and persistent item losses. No doubles-specific full reset or between-stage access is established. Field, each participant's actual resources and relevant histories cannot be replaced with fresh defaults merely because a new stage begins. [D; L; E] |
| Faints / victory / encounter end | Opponent-side completion, one remaining active slot, simultaneous faints, target disappearance, recoil/residual adjudication and defeat conditions are not completely specified. Track player faints regardless of whether a different teammate later wins; do not make a blanket PP/Struggle termination claim. [D; E §9] |

### Campaign tag battles

| Dimension | Evidence / remaining boundary |
|---|---|
| Player/partner control | **Not established:** whether the NPC partner is CPU-controlled in every relevant tag encounter, whether any commands can be chosen/influenced, who chooses partner replacements, who owns each reserve pool, or whether the player may ever supply both slots. Treating the partner as either fully controllable or an ordinary enemy-AI clone is an unsupported assumption. [A; M; P; T] |
| Information | Partner roster disclosure, when partner actions/targets are observable, what the partner knows about each side, and whether partner/opponents share choices are not established. A's enemy-AI knowledge statement is not a tag-partner information contract. |
| Team selection / CPU participation | T explicitly lists three Pokémon under **“Trainer Steven Space Center”**: Dialga ([line 138](https://github.com/dekzeh/calc/blob/12ac2532554f220ee02b6573667fe7b55978b4a2/src/js/data/sets/gen8.js#L138)), Metagross ([line 382](https://github.com/dekzeh/calc/blob/12ac2532554f220ee02b6573667fe7b55978b4a2/src/js/data/sets/gen8.js#L382)), Steelix-Mega ([line 571](https://github.com/dekzeh/calc/blob/12ac2532554f220ee02b6573667fe7b55978b4a2/src/js/data/sets/gen8.js#L571)); also Space Center Maxie/Tabitha teams. **Inference only:** these are useful candidate participants for a tag fixture. The data does not prove they fight together, determine who controls Steven, establish a three-Pokémon player limit, or exhaust campaign tag encounters. No version-matched player maximum/minimum or participation/ownership rule was established. |
| CPU actions / replacement | A's doubles partner interactions are candidate enemy-side behavior **if** the tag encounter uses that AI path. That applicability and the friendly partner's AI/scoring, targeting, switches, reserves and replacement order are not established. P cannot supply a missing tag routine. |
| Entry / between-fight actions / carry-over | Partner entry health/items, any automatic player healing, selectable leads, reordering, access to the full player party after partner exhaustion, and boundary restoration are not established. Do not initialize a partner or player to full merely from the word “tag.” M's gym-only claim does not establish Space Center healing. |
| Faints / victory / encounter end | **Not established:** whether partner exhaustion immediately loses, permits solo continuation, changes field-slot control, or triggers another rule; likewise player-party exhaustion while the ally survives, both enemy trainer pools' exhaustion, simultaneous faints, and scripted exits. **Product distinction:** a faint by a separately owned NPC partner is not itself a faint by one of the player's Pokémon; it may still alter victory and the player's subsequent faint risk. Track it; do not treat it as harmless or silently redefine the player's risk event. [D; root glossary; E §9] |

### Forced back-to-back sequences

| Dimension | Evidence / remaining boundary |
|---|---|
| Player/partner control | **Product decision:** one plan covers the entire forced sequence [D]. **Game rules not established:** which stages exist, each stage's underlying format/control ownership, and whether any inter-stage input is allowed. “Back-to-back” is not evidence of a particular menu restriction. |
| Information | Stage order, visibility of the next opponent before a permitted choice, partner changes and whether CPU knowledge is reinitialized are not established. Carry the player's actual observations forward without granting unseen future CPU commands. [A; D] |
| Team selection / CPU participation | Player limit per stage, locking the initial selected team, new participant/party allocation, forced leads, and selecting a new team from owned reserves are not established. T has separately labelled **Museum #1 / #2** teams, but labels alone do not prove a forced sequence, lack of menu access, or transition rules. [T; L] |
| CPU actions / replacement | Each stage needs its actual singles/doubles/tag routine, participants, ordered reserves and relevant information. Resetting enemy parties, treating replacements as a fresh battle, or carrying the same enemy AI history between stages requires evidence. A/P do not specify stage scripts. |
| Between-fight actions | **Not established:** bag/PC access, healing/reviving/PP restoration, held-item reassignment, team substitution, move changes, reordering/lead choice, cancellation or escape opportunities. “Bag inaccessible during trainer battles” [M line 8] does not answer what happens *between* fights. |
| State carry-over | **Product decision:** carry actual HP, PP, status, resources and faint history across the whole sequence; apply only game-permitted changes [D]. **Not established:** the precise transition for every field, including fainted party members, sleep/toxic counters, temporary stat/volatile effects, weather/terrain/hazards, forms/abilities, move/choice locks, used/held/transferred items, partner state, and CPU history. M's pre-gym-heal, sleep-entry and item-loss claims are candidate exceptions, not permission for universal resets. Unknown transitions remain unknown—not “unchanged” certified as game behavior. |
| Faints / victory / sequence end | **Product decision:** any player faint at any stage counts, even if later healed/revived; the final sequence victory, not an intermediate win, is the planning success boundary [D]. **Not established:** stage-advance triggers, final-stage identity, failure/blackout/retry handling, intermediate mutual-faint adjudication, interruption and special-script victory. Do not reset accumulated risk, multiply unconditional stage-success marginals, or certify victory by winning only stage one. [D; E] |

## 5. Equipment and state obligations already settled

The player's initial planned equipment choices are **empty or Oran Berry**, through a player-editable **trainer-specific allowlist**, and bounded by actual owned copies. A disallowed item already equipped in actual player state is not silently removed; changing it is planned preparation, not a factual correction. Other actual HP/status/PP and known-move constraints remain in force. [D; L]

This is **not an item-mechanics whitelist**. A explicitly scores **Trick/Switcheroo** while holding Toxic Orb, Flame Orb, Black Sludge, Iron Ball, Lagging Tail or Sticky Barb [A lines 369–375](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L369-L375), and **Fling** involving a speed-raising item and a partner's Weakness Policy [A lines 202–208](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md#L202-L208). Those are documented scoring cases, not a complete item-transfer resolution specification. All feasible opponent items and acquisition/loss/consumption/transfer outcomes remain coverage obligations, including across stages; they cannot be pruned because the player could not initially equip them. [D]

M's no-restoration claim is particularly relevant to Oran Berry consumption, but does not prove a complete 1.07 ownership/transfer transition. Do not create free berries or reinstate original held items at a stage boundary.

## 6. Small, genuinely necessary follow-up questions

These are suggested bounded evidence questions, **not new issues created by this investigation**. Existing local build identification and broad RNG/termination evidence work remain separate. None asks the player to choose a new risk standard.

1. **Verify campaign selection and control rules, including tag partners.** For the intended encounter entries, what numeric maximum/minimum and eligibility rules constrain the selected player team; who controls each active slot, replacements and reserve pool; what can the player observe before committing? In tag battles specifically, what does the friendly partner know, how are its actions/targets chosen, and is that the same AI as the enemy? Request authorized version-attributed documentation or a small lawful input/result record showing the relevant selection and command screens. Resolve per encounter family or record explicit exceptions; opponent roster size is not an answer.
2. **Document forced-sequence boundaries and inter-stage transitions.** Which campaign fights form each forced sequence, in what order, and exactly which menus/actions, lead/team/item changes, heals and field/history resets occur at each boundary? Ask for a per-boundary before/after ledger of HP, PP, status/faints, held/used items and resources, plus temporary effects when relevant. Obtain documentary authority or narrowly scoped lawful observations; do not infer a campaign-wide rule from one sequence.
3. **Establish format-specific victory, exhaustion and simultaneous-faint adjudication.** What ends each encounter/stage when a player, tag partner or one enemy trainer exhausts its reserves; can remaining participants continue; how are last-Pokémon recoil/residual mutual faints and scripted advancement classified? Tie this to the existing termination evidence gap, without requiring a universal PP/Struggle proof merely to record these finite boundary rules.
4. **Authenticate the additional mechanics-document claims before relying on them as 1.07 rules.** Can an authorized original/version history confirm Set style, trainer-bag restrictions, the exact fields and timing of gym healing, sleep-entry reset and held-item non-restoration, including sequence/tag exceptions? If unavailable, keep each explicitly provisional and request only the particular rule needed for a plan. Exact local ROM identity belongs to the existing build-identification ticket, not a duplicate here.

A small recording/replay can establish an observed case or discriminate hypotheses. It does not alone establish exhaustive outcome support, exact probabilities, a universal rule, or zero faint risk. Continue planning under the agreed document with unresolved cases visible and affected guarantees nonqualifying/conditional, as D requires.

## 7. Search boundary and reproducibility

Read the research ticket, parent Notes, the complete scope resolution, the prior evidence ticket's body/comments and pinned report; inspected A and the pinned M/P documents directly, and author-published calculator metadata/data T. Public GitHub API reads supplied the immutable file identities and named-participant extraction. No production simulator behavior was treated as a game oracle.

Bounded web searches for author/release documentation, tag rules, selection limits and back-to-back healing did not produce an accessible version-attributed primary encounter specification. Search snippets, strategy sites, Nuzlocke house rules, videos and third-party tools were **not** promoted to game-rule evidence. Author-owned public repositories inspected were `dekzeh/calc` and `dekzeh/runandbundex`; data publication is not AI/encounter-script publication.

A third-party reference index exposed a [trainer spreadsheet link](https://docs.google.com/spreadsheets/d/1Ezdd8k-pDlVocd0NHUkGwZXcegfG-KTOraM_uZUsr6s/edit?gid=665425777). Its contents and provenance could not be inspected: the text fetch failed DNS lookup and browser navigation was blocked. It is an **unverified acquisition lead only**, not a citation supporting any rule above. Other external documentation pages were unavailable from this environment; no access restriction was bypassed. No claim is made that the missing rules are undocumented everywhere.

No code tests were necessary for this documentation-only artifact. Validation consisted of checking citations against the retrieved sources, confirming the source version distinctions, reviewing every requested dimension for all four formats, and verifying a documentation-only diff. No changes were made to `calc/`, domain decisions, the parent map, or the parent working branch. Publish only this report on a throwaway research branch; no PR or merge.
