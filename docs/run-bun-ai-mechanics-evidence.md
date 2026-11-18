# Run & Bun CPU action probabilities and mechanics: primary-source evidence

Research date: 2026-11-18. Worktree base commit: `9fa20e6b693179b431b01f659813c08e8228ea29`.
Scope: CPU (AI) move/switch probabilities, outcome/faint-risk evidence, and whole-battle PP/Struggle termination. Research for [#124](https://github.com/tnclark8012/runbuncalc/issues/124), under [#113](https://github.com/tnclark8012/runbuncalc/issues/113); incorporates the sure-eventual-victory requirement in [#132's resolution](https://github.com/tnclark8012/runbuncalc/issues/132#issuecomment-6953237115). No production model, search algorithm, architecture, emulator, ROM, or user save was used.

Vocabulary follows `GLOSSARY.md` (**Faint risk**, **Riskless victory**, **Live battle state**, **Branching battle plan**). This report does not conflict with `docs/adr/0001-capacitor-app-and-native-save-access.md`.

## 1. Bottom line

1. **No public Run & Bun (RnB) AI implementation was located in this bounded investigation.** Absence from the searches is not proof that none exists.
   - The primary AI-behaviour reference located is the community investigation document by "Croven" (1.07), already in the repo as `docs/ai.md`. It contains no hyperlinks. Its named authorship makes it primary evidence of the investigator's claims, not first-party implementation proof; its original publication/revision chain was not recovered.
   - It is a *documented* source, not an implementation source. It is empirical and reverse-engineered, and its own preamble says it may be incomplete or mistaken.
2. **The RnB AI is not stock pokeemerald-expansion (RHH).**
   - The data headers in the author's `dekzeh` account resemble expansion ~1.3.0 (section 4); the exact engine base/build is unverified.
   - Upstream 1.3.0/1.4.1 AI uses a different score scale, no random damage roll, no omniscience, and a different post-KO switch-in algorithm.
   - So upstream code can only supply *structural* evidence (how ties, switch checks, shared RNG and doubles loops are built). It cannot confirm RnB's numbers.
3. **Circumstantial fit, not a recovered probability law.** Rounded percentages are compatible with upstream's biased modulo checks (section 5). Matching a rounded percentage does not identify a threshold, primitive, draw order, or joint distribution.
4. **No unconditional exact/certified RnB action or whole-battle risk claim follows from these sources alone.** Even conditional on the document, omitted rules and unspecified correlations prevent exhaustive exact probabilities without extra assumptions. Rational arithmetic can be exact *within an explicitly completed model*, not proof that that model covers the game.
5. **No save is needed** for source/data inspection, arithmetic, and much synthetic testing. A new lawful locally prepared battle can replace a personal playthrough save. Observing the actual engine requires an identified lawful build and reproducible states/traces; sampling alone cannot certify omitted rare outcomes.
6. **PP exhaustion plus Struggle supports only a conditional local faint argument, not a whole-battle termination theorem.** Published data supports modern Struggle and Protect interaction, while upstream supplies explicit PP restoration and recoil machinery. No reachable indefinite RnB battle, universal termination proof, or RnB simultaneous-last-faint rule was established (section 9). Termination is unresolved, not certified and not disproved.

## 2. Sources and pinned identities

| ID | Source | Pinned identity | Kind | Access |
|---|---|---|---|---|
| S1 | Croven, "Pokemon Run and Bun (1.07) AI document" | Repo copy `docs/ai.md`, git blob `75692b00e19d23bcc7082543e0fa456ed96996e4` (worktree HEAD `9fa20e6`). Public mirror `pranavmenonx/PokemonRunAndBunHelper:AI Document for RnB (1.07).txt`, blob `08235f567d8702b22f4c4bd93a4625c06115217f`, repo head `d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7` | Community investigation (documented = author's claim only) | OK. Mirror's inspected beginning differs in formatting; full semantic equivalence was not established. Original document license/provenance unknown; mirror repository's MIT license does not establish rights to this document. |
| S2 | "Post-KO Switch-in AI.txt" (same author/mirror) | blob `0bf41272b4efcb9fa074026a80488e0125c43c15` | Community documentation | OK |
| S3 | "Mechanic Changes.txt" (RnB mechanic list; text says "assume Generation 8 mechanics" for anything unlisted) | blob `65c8cf0cdc7f02b6c86ef0fd2601cf58cbd7bffa` in S1 mirror revision | Mirrored documentation, original author/revision not established | OK; a fallback statement, not validation of every Gen 8 interaction |
| S4 | `dekzeh/runandbundex` (hack author's account): `moves/battle_moves.h`, `species/*.h`, `abilities/abilities.h` | master `ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab`; `moves/battle_moves.h` blob `ba0ac02f281c9add58dcfbf6e2319f26e5d5d196` | Real game data headers (data only; no AI code) | OK |
| S5 | `rh-hideout/pokeemerald-expansion` tags `expansion/1.3.0` = `23acbb370dabaf339e419cf1e2b6e13f3640c734` (2022-11-18) and `expansion/1.4.1` = `8bfd4d0f51224bfe4cca6130ab1c8a9c1580f85b`. Blob shas at 1.3.0: `src/battle_ai_main.c` `9604f119511eff0f93392d6e8a9ebe76ae927693`, `src/battle_ai_switch_items.c` `5876e8b4747ace2a4ac574e03a0b144191bfc4a7`, `src/battle_ai_util.c` `113d5d3e01deddd74c2d020a132fe267bdc84f79`, `src/battle_util.c` `faf4cdb89ab6ee4cee67993496246117d5041c30` | Upstream engine source (implementation-confirmed for *upstream only*) | OK |
| S6 | `dekzeh/calc` (the author's damage calc, last push 2024-05-21, head `12ac2532554f220ee02b6573667fe7b55978b4a2`) | not examined | Damage calc, not AI | Not read (time-boxed; it is a Showdown-calc fork, not an AI source) |
| S9 | Upstream battle scripts and script commands (termination research) | S5's 1.3.0 commit: `data/battle_scripts_1.s`, `src/battle_script_commands.c`, `src/battle_main.c`, `include/constants/battle.h` | Implementation-confirmed for that upstream revision only | Read using raw GitHub content; no executable build used |

### Direct, immutable source links

- [S1 repository AI reference](https://github.com/tnclark8012/runbuncalc/blob/9fa20e6b693179b431b01f659813c08e8228ea29/docs/ai.md), [S1 mirror tree](https://github.com/pranavmenonx/PokemonRunAndBunHelper/tree/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7).
- [S2 post-KO switch document](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Post-KO%20Switch-in%20AI.txt), [S3 mechanics document](https://github.com/pranavmenonx/PokemonRunAndBunHelper/blob/d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7/Mechanic%20Changes.txt).
- [S4 published move data](https://github.com/dekzeh/runandbundex/blob/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab/moves/battle_moves.h), [S4 complete data tree](https://github.com/dekzeh/runandbundex/tree/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab).
- [S5 AI main 1.3.0](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_ai_main.c), [AI main 1.4.1](https://github.com/rh-hideout/pokeemerald-expansion/blob/8bfd4d0f51224bfe4cca6130ab1c8a9c1580f85b/src/battle_ai_main.c), [AI utility 1.3.0](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_ai_util.c), [switch/item AI 1.3.0](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_ai_switch_items.c), [switch/item AI 1.4.1](https://github.com/rh-hideout/pokeemerald-expansion/blob/8bfd4d0f51224bfe4cca6130ab1c8a9c1580f85b/src/battle_ai_switch_items.c).
- [S5 RNG implementation](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/random.c), [RNG header](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/include/random.h), [battle utilities](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_util.c).
- [S9 battle scripts](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/data/battle_scripts_1.s), [script commands](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_script_commands.c), [battle main](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/src/battle_main.c), [battle outcome constants](https://github.com/rh-hideout/pokeemerald-expansion/blob/23acbb370dabaf339e419cf1e2b6e13f3640c734/include/constants/battle.h).

**Not found / inaccessible**
- No RnB AI C source/disassembly repo was located in the bounded name searches; results inspected were tools/trackers/calculators. This is not a comprehensive absence claim.
- The author's own Discord / Google Docs were not fetched (I did not attempt login-gated sources).
- I did not chase later RnB versions beyond one web search, which turned up nothing authoritative about post-1.07 AI changes. **The AI doc's version (1.07) vs. the version the user plays is unresolved.**

## 3. Documented claims (from S1–S3) relevant to probabilities

Line numbers are `docs/ai.md` unless noted. These are all **documented**, not implementation-confirmed.

- **Selection rule.** Score every move (and every target in doubles); pick the highest; random tie-break among equal scores (`docs/ai.md:10`).
- **Information.** AI "knows your full team's stats, moves, and Abilities at the start of the battle" (`docs/ai.md:12`).
- **Common scores** (`docs/ai.md:21-24`):
  - highest damaging move +6 (80%) / +8 (20%);
  - slow kill +9 / +11;
  - fast kill +12 / +14;
  - speed ties count as AI faster.
- **Damage randomness.** The AI "will roll a random damage roll for all of its attacking moves", excluding Explosion, Final Gambit, Relic Song, Rollout, Meteor Beam, trapping moves and Future Sight (`docs/ai.md:48-72`). These skip the "highest damage" bonus but still get kill bonuses, except Explosion, Final Gambit and Rollout.
- **Kill bonuses** (`docs/ai.md:51-62`): +6 if AI is faster (or has priority while slower), +3 if slower, +1 for Moxie-like abilities.
- **Crit-flavoured bonus.** High-crit move that is super-effective: +1 (50%) (`docs/ai.md:64-65`).
- **Voluntary hard switch** (`docs/ai.md:26-45`):
  - single battles only; in doubles "never switches unless niche situations like Perish Song";
  - requires (1) all moves ineffective (score <= -5, e.g. Encore/PP stall/Choice), (2) a back mon that is faster-and-not-OHKO'd or slower-and-not-2HKO'd, with a documented bug (one faster back mon makes the AI think *every* later mon is faster), (3) the active mon is not below 50% HP;
  - then **50% chance to switch**, destination by the post-KO switch-in AI minus mons failing check (2);
  - Perish Song follows its own routine, "unknown to us".
- **Post-KO switch-in** (S2): score table (+5 faster and OHKOs ... -1 slower and OHKO'd; +2 Ditto; +2 Wynaut/Wobbuffet except when slower and OHKO'd). Ties go to the first mon in party order. Damage is compared in % of HP. The document does not establish which damage roll, ability interactions, equality/speed ties, or candidate exclusions are used.
- **Many other random components** at `docs/ai.md` lines 83, 129, 140, 151-153, 162-178, 301-311, 322-326, 338-342, 355, 371, 559, 561, 615, 635-641, 664-670 (see the "Randomised components" list in section 5).
- **Move-specific history/state inputs:** Sucker Punch used last turn, Protect used last 1-2 turns, first turn out, hazards already up, Substitute/HP thresholds, etc. These are **state that must be tracked in the Live battle state**.
- **Crit mechanics (S3):** "Critical hit chance: 1/16. Critical hit damage multiplier: 1.5." Everything unlisted is Gen 8.
- **Not covered by the doc:** how the AI chooses the target in doubles beyond "highest move+target", accuracy handling, whether random score components are drawn per move or shared, the exact switch-check formulas, whether damage rolls are 16-valued.
- **Explicit incompleteness/ambiguity inventory:** the preamble omits moves and most “bad move” checks; Perish Song switching is expressly unknown (line 45); poisoning/offensive/defensive setup sections report broken checks without an implementation trace (402, 435, 451); Encore's encouraged-move list is intentionally omitted (620–622). Recovery logic is provided at 646–673, not entirely unknown, but its prose has overlapping slower-than-target HP conditions (“below 70%” random return versus “below 50%” true), and exact equality/rounding at thresholds needs verification. Do not repair these by generic Pokémon intuition or stock-upstream rules.

## 4. Version / lineage evidence (implementation-confirmed for data; inferential for AI)

Reproducible fingerprint (read-only, uses only public GitHub raw content, no temp files):

```sh
R=rh-hideout/pokeemerald-expansion
for t in 1.0.0 1.1.0 1.2.0 1.3.0 1.4.0 1.4.1 1.5.0; do
  echo -n "$t: "
  diff <(gh api "repos/$R/contents/src/data/battle_moves.h?ref=expansion/$t" -H "Accept: application/vnd.github.raw") \
       <(gh api "repos/dekzeh/runandbundex/contents/moves/battle_moves.h" -H "Accept: application/vnd.github.raw") | grep -c '^[<>]'
done
```

Observed changed-line counts vs the author's `moves/battle_moves.h`: 1.0.0=437, 1.1.0=431, 1.2.0=423, **1.3.0=401**, 1.4.0=1483, 1.4.1=1483, 1.5.0=2426. The big jump at 1.4.0 means the hack's data structure predates 1.4.0.

The residual differences include retuning and may include other upstream ancestry/formatting changes. Example: `MOVE_RELIC_SONG` has the same struct shape (`.zMovePower`, `.zMoveEffect`, `.flags`, `.split`).

**Conclusion:** this single-file similarity is a lineage clue, not proof of the fork commit, build settings, release date, or AI implementation. The documented score scale differs from both inspected upstream tags (section 5).

## 5. Implementation-confirmed (upstream 1.3.0 / 1.4.1) structure and where RnB differs

### 5a. Structure that likely carries over (inference, unverified for RnB)

- **Move choice:** scores computed per move; highest score kept; ties -> `Random() % numOfBestMoves` (`battle_ai_main.c` 1.4.1:387-483; the tie-break is line 483).
- **Singles voluntary-switch trigger lives in the same function** (1.4.1:416-445):
  - threshold `cap = 95` if CHECK_VIABILITY else `93`, with the default score 100, so "all scores <= 95" is "<= -5 relative", matching S1;
  - plus HP >= 50% (S1's "not below 50%");
  - plus `GetTotalBaseStat >= 310` (**not in S1**; an upstream-only condition; RnB may or may not have it);
  - plus a suitable switch target. Upstream then returns `AI_CHOICE_SWITCH` **deterministically**. S1's "50% chance" is not in upstream 1.3.0/1.4.1, so that clause is either RnB-added or a different mechanism; the doc is the only evidence.
- **Doubles loop** (1.4.1:486-603):
  - for each potential target the whole scoring pass (`BattleAI_SetupAIData` + all flag functions) is re-run, so random score components are **redrawn per target**;
  - the best move per target is chosen with its own `Random()` tie-break;
  - the best target is chosen by max score with another `Random()` tie-break;
  - moves aimed at the partner with score < 100 are discarded;
  - the second AI battler sees the first battler's chosen move (`GetAllyChosenMove`).
- **Randomness primitive** (`battle_ai_util.c` 1.3.0:448-452): `AI_RandLessThan(val)` is `(Random() % 0xFF) < val`.
- **Shared RNG:** `Random()` is one global LCG; `gRngValue = 1103515245*gRngValue + 24691`, returns the top 16 bits (`random.c` 1.3.0:10-16; `random.h` ISO_RANDOMIZE1). Score draws, tie-breaks, accuracy rolls, crit rolls and damage rolls all consume the same stream. Upstream uses `Random()` (not `Random2()`) in the AI.
- **Real damage roll** is `dmg *= 100 - (Random() % 16); dmg /= 100` (85..100, equal marginal weights *if* the consumed 16-bit value is uniform; 65536 % 16 == 0), `battle_util.c` 1.3.0:9443-9448. Distinct factors can round to the same HP damage; aggregate joint outcomes without discarding history.
- **Upstream caches per-move simulated damage per turn** (`AI_DATA->simulatedDmg`, `battle_ai_main.c` 1.3.0:377-380), so every scoring function in a turn sees the *same* simulated number for a given move/target. If RnB's random-roll behaviour is built the same way, the roll is drawn once per move per pass and reused, which makes kill/best-move conditions perfectly correlated within one move. Unconfirmed for RnB.

### 5b. Confirmed differences from RnB's documented behaviour (so upstream is NOT an oracle)

| Topic | Upstream 1.3.0/1.4.1 | RnB doc |
|---|---|---|
| Kill bonus | +4 faster/priority, +2 slower (`AI_TryToFaint`, 1.4.1:2624-2650, 1.3.0:2614-2650) | +6 / +3, and kill is on top of "highest damage" +6/+8 |
| AI damage in scoring | Deterministic: no random factor (`CalculateMoveDamageAndEffectiveness` passes `randomFactor=FALSE`, `battle_util.c` 1.3.0:9463-9467); expected-value crit blend in `AI_CalcDamage` (`battle_ai_util.c` 1.3.0:727-760) | "Random damage roll" |
| Opponent ability knowledge | **Guessed** at random from base-stat ability slots unless seen (`battle_ai_util.c` 1.3.0:1165-1196, uses `Random() % NUM_ABILITY_SLOTS`) | Fully known |
| Post-KO switch-in | Baton Pass, then type matchup, then damage (`GetMostSuitableMonToSwitchInto`, `battle_ai_switch_items.c` 1.4.1:910-980) | Score table in S2 |
| Doubles hard switch | `ShouldSwitch()` runs for any trainer battle (1.3.0:614-735), includes random super-effective-matchup switching (`Random() % 10`, `% 3`, etc.) irrespective of battle type | "never switches" |
| Switch chance | Deterministic when conditions hold | 50% |
| High-crit SE bonus | +1 with `AI_RandLessThan(128)` (`battle_ai_main.c` 1.3.0:3085) and +2 in TryToFaint | +1 (50%) |

**Conclusion:** upstream cannot be used to confirm numeric claims. Treat it as a hint about code *shape* only. Do not use Pokemon Showdown or `@smogon/calc` as an AI oracle either; they model the player-facing battle rules, not this AI.

### 5c. Exact probabilities of the upstream random primitives (arithmetic, reproducible)

For a **uniform input over all 65,536 returned values**, `Random() % m` has modulo bias unless `m` divides 65536. This is an arithmetic experiment, not evidence that the game consumes a uniform value conditional on earlier score/attack events. Reproduce with Python (stdlib `fractions`):

```python
from fractions import Fraction as F
p = lambda mod, thr: F(sum(1 for r in range(65536) if r % mod < thr), 65536)
```

| Expression | Exact probability | Decimal |
|---|---|---|
| `AI_RandLessThan(100)` | 25701/65536 | 0.39217 |
| `AI_RandLessThan(128)` | 32897/65536 | 0.50197 |
| `AI_RandLessThan(176)` | 45233/65536 | 0.69020 |
| `AI_RandLessThan(204)` | 52429/65536 | 0.800003 (matches "~80%") |
| `AI_RandLessThan(207)` | 3325/4096 | 0.81177 (matches "~81%") |
| `Random() % 100 < 50` | 16393/32768 | 0.500275 (upstream Protect path) |
| `Random() % 3 != 0` | 21845/32768 | 0.666656 |

This shows the doc's "~" values are consistent with `k/255` thresholds; the doc's un-tilded "50%" could be exactly 1/2 (`Random()&1`, `%2`) or 128/255-ish. **Unresolved which.** The effect is ~0.2 percentage points, so it matters for rare-event enumeration but not for which branches exist.

## 6. Evidence matrix

Legend. Source level: **D** = documented by community author/mirror (S1-S3); **U** = upstream implementation-confirmed (S5), not RnB; **A** = assumption; **?** = unresolved. **Exact** means complete, version-matched probabilities with justified joint law; arithmetic can separately be exact conditional on explicit premises. **Certified** means a justified bound covering every feasible modeled case under stated assumptions; it need not be a point probability. **Estimate** uses approximations or sampling; **unsupported** lacks an evidential basis; **incomplete** omits or cannot resolve cases. Neither a test match nor a simulator result by itself certifies the game.

| # | Claim | Evidence | Confirmation level | Modelling status now | What would upgrade it |
|---|---|---|---|---|---|
| 1 | AI picks max score, random tie among equal | D `ai.md:10`; U 1.4.1:387-483 | Documented + upstream-confirmed structure | incomplete: "random" does not establish uniform weights; `% n` may be biased | Version-matched implementation and draw law |
| 2 | Highest-damage +6/+8 (80/20) | D `ai.md:21,50` | Documented only; per-move vs shared draw **?** | estimate (4/5 vs hypothesized upstream primitive) | Version-matched trace/source and justified input domain |
| 3 | Kill bonuses +6/+3/+1 | D `ai.md:51-62` | Documented only | conditional score arithmetic exact; game coverage incomplete | Version-matched check |
| 4 | AI "rolls" damage randomly (which distribution/16 values?) | D `ai.md:48`; U differs (deterministic) | **?** (distribution, per-move vs shared, crit inclusion) | incomplete | Emulator/ROM |
| 5 | Base crit: 1/16, x1.5 | D S3 | Documented, original provenance/build unverified | estimate/incomplete, especially stages, immunity and joint roll order | Version-matched mechanics/fixtures |
| 6 | Doc's score components with 25/75, 50/50, 5/95, 70/30 chances | D lines 83-670 | Documented only | estimate/incomplete, not exact from rounded marginals | Version-matched primitive/correlation evidence |
| 7 | AI knows full player team stats/moves/Abilities | D `ai.md:12`; U guesses abilities | Documented only; differs from upstream | incomplete: items, updates after changes, hidden counters not specified | Version-matched knowledge trace |
| 8 | Singles hard switch needs all moves <= -5, HP >= 50% | D `ai.md:26-45`; U 1.4.1:416-445 (cap 95, HP half; plus BST>=310 in upstream) | Documented + structural upstream support; BST clause **?** | incomplete | ROM check |
| 9 | 50% chance to switch when conditions hold | D only; not in upstream | Documented only; exactness **?** | estimate | RNG sweep on a fixture |
| 10 | Faster/OHKO check bug ("one faster back mon implies all faster") | D only | Documented only | incomplete (affects which destination is legal) | Fixture with mixed bench |
| 11 | Switch-in target = highest table score, ties first in party order | D S2 | Documented only | conditional score arithmetic exact; actual candidate eligibility/damage law incomplete | Fixture |
| 12 | No hard switching in doubles except niche (Perish Song) | D `ai.md:27-29`; U differs (type-based switching exists) | Documented only; Perish Song routine "unknown" | unsupported for Perish Song; "no switch" for rest is estimate | Doubles fixture |
| 13 | Doubles move+target selection: highest (move,target), ties random | D `ai.md:10`; U 1.4.1:486-603 | Documented + upstream structure | incomplete: per-target redraw, ally ordering, ties unresolved | Fixture |
| 14 | Score/selection/attack draws share RNG, so independence cannot be presumed | U `random.c`, `random.h`; RnB coupling unresolved | Implementation-confirmed upstream; inference for RnB | joint law unresolved; never multiply marginal weights as certification | Draw-call trace plus justified seed/input ensemble |
| 15 | "Existing code excludes bench <=25% HP / doubles filtering incomplete" | Not game evidence (user instruction) | **None** | unsupported | n/a |
| 16 | AI information need not equal player observation | D full-team knowledge; observation contract must be specified | Documented + product constraint | incomplete until exact observable fields/timing verified | UI/emulator observation fixture |
| 17 | Version scope: doc is 1.07 | D title | **?** for later patches/forks | incomplete | Patch/build identity and local ROM hash |
| 18 | PP depletion forces Struggle; recoil guarantees battle ends | S4 move data; U S9; no version-matched theorem | Conditional local mechanics only | whole-battle termination unresolved, not certified | Section 9 obligations/fixtures |
| 19 | Omitted bad-move/Encore rules, setup bugs and recovery boundaries are complete enough | S1 explicitly omits rules; recovery prose needs precedence/rounding checks | Incomplete, partly ambiguous | unsupported for affected missing predicates | Full predicate lists and boundary traces |

## 7. Modelling guidance for "exhaustive feasible nonzero outcomes"

- **Enumerate, do not round.** Never drop an outcome because it is "rare". The documented rare branches include: Explosion at >=66% HP (~5%, `ai.md:326`), Sucker Punch/Protect -20 half-chances, +14 at 20% on fast kills, 5% bonuses, 50% switch, 1/16 crits, and each of the 16 equiprobable damage rolls (if RnB keeps upstream). Use rational arithmetic.
- These examples are not a complete outcome inventory. “All feasible nonzero outcomes” includes move misses/failures, voluntary CPU switches and destinations, attack/secondary/status/residual outcomes, replacement and doubles interactions, as well as damaging hits. A 0% claim requires justified absence of every fainting execution; seeing no faints in samples does not establish zero risk. A nonzero tolerance may use a certified upper bound only when it encloses omitted uncertainty and joint dependence—not merely confidence in a Monte Carlo estimate.
- **Preserve the joint law; do not make score components independent Bernoulli variables.** Give draws source identities and record whether reused, redrawn, conditional, or unknown. Neither sharing draws nor independently redrawing them per move/target is established for RnB. Unknown correlations include which candidate rolls are evaluated at all, cached damage, scoring passes, tie-breaks, voluntary switches, and subsequent attack RNG.
- **Tie-sets** must be computed after all score draws; a selected move may differ per draw combination. Multiple kill moves "all get the highest-damage bonus" (`ai.md:51`), so their relative scores depend on whether the +2 draw is per move or shared (**?**). Model both and report the spread.
- **Parameter sensitivity:** compare explicitly hypothesized primitives if useful. A range over two guessed values of `q` is only a sensitivity estimate: it is **not a certified interval** unless all feasible primitives, correlations, and omitted outcomes are enclosed. Conservative support can help a bound only if completeness and version applicability are justified.
- **Joint AI/attack RNG dependence:** upstream is deterministic given complete engine state and input/timing, not independent random draws. Unknown initial seed is not automatically a uniform prior; conditional seed distributions change after observing actions/damage. Retain the joint dependence or mark results unresolved. No independence approximation is endorsed as certification here.
- **Information.**
  - Condition CPU probabilities on the information the CPU actually uses. S1 documents full team stats, moves, Abilities at battle start; it does not settle every item, transformed state, revelation rule, or update timing.
  - Branching player actions may depend only on observable outcomes at the decision point, not the sampled AI score, internal seed, exact hidden opponent HP, or unobserved roll. An action observation can narrow hidden-state possibilities without revealing them.
  - Preserve exact HP/PP/status of active **and bench** Pokémon, move limitations, item consumption/restoration, switch order, prior actions, Protect chains, Sucker Punch history, first-turn flags, and delayed effects where applicable. Which of these are visible must be checked, not assumed from the simulator UI.
- **Unsupported/incomplete outcomes must be surfaced, not silently approximated:** Perish Song AI, Baton Pass destination, any move the doc omits ("not exhaustive"), doubles voluntary switching, the BST>=310 condition, the faster-mon bug destination set.

## 8. What can be validated without user saves, and precise lawful fixture needs

**Can validate now (no ROM, no save):**
1. Arithmetic of the random primitives (section 5c) and that doc percentages are reproducible by `k/255` thresholds (`~80`: k=204 -> 0.800003; `~81`: k=207 -> 0.81177).
2. Internal consistency of `docs/ai.md` (e.g. fast kill +12/+14 = highest-damage 6/8 + 6; Fell Stinger totals; scores add as the doc states) and consistency with S2/S3.
3. Upstream structural claims (tie-breaking, doubles re-draw, cap-95 switch trigger) from pinned tags S5.
4. Data-level facts about moves/abilities/species from the author's headers S4 (e.g. priority, high-crit flag, `.effect`) at the pinned blob.

**Needs version-matched execution or implementation evidence, not necessarily a personal save:**

Use an owner's lawful local patched build or an authorized maintainer harness. A generated test state/new playthrough can substitute for personal progress. Do not distribute ROMs, saves, copyrighted source dumps, or secrets. Share only lawful small test inputs, derived logs, hashes, and paraphrased findings.

| Fixture family | Required discriminating cases / observations |
|---|---|
| Identity and replay | Patch/release identifier, patch hash and local ROM hash, emulator/core revision, script/harness revision, full starting state hash, input/timing, seed-state identity, expected event sequence. A ROM hash identifies a build, not its correctness. |
| Scores and tie-breaks | Distinct vs equal damaging moves; damage on either side of KO threshold; multiple killers; high-crit bonus; speed/priority ties; 2/3/4-way score ties; omitted and “useless” move checks. Log candidate scores, simulated damage, chosen action, and RNG call positions if lawfully available—not just final frequencies. |
| Voluntary/forced switches | HP immediately below/at/above half; ineffective score below/at/above -5; HP rounding; locked/Encored/all-PP-empty actors; bench below/at/above 25% (no documented exclusion); mixed bench speeds with party-order permutations; KO and 2HKO boundaries, hazard-entry faints, no eligible bench, post-KO tie order; Perish Song; pivot/Baton Pass/forced-switch categories kept distinct. |
| Doubles | Both AI battlers choosing, ally/foe targets, target ties, spread damage/accuracy per recipient, friendly fire, ally immunity/ability, Protect/redirection, partner faint before action, vacant slot/retargeting, replacement order, Perish Song/switch exceptions, ally-selected-action dependence. |
| Actual outcomes | Accuracy/evasion (including always-hit), crit stages/immunity, speed ties, each damage factor and integer rounding, multihit counts and per-hit rolls, secondary effects, full paralysis/confusion/sleep/freeze, recoil/drain/contact abilities, residual/end-turn ordering, simultaneous last faints. These are fixture obligations, not claims that one generic Gen 8 rule suffices. |
| History / exhaustion | Repeated Protect/Sucker Punch, first-turn and switch reset flags, PP/Pressure/Choice/Disable/Taunt/Encore interactions, consumed/used-item slots, restoration, Transform/reset behavior, bench HP/PP persistence, relevant turn counters and finite-resource depletion (section 9). |
| Information | Paired states identical to the player at the decision point but different in hidden CPU/engine fields; identify what changes CPU actions, what is actually displayed, and when. A plan must prescribe the same action for indistinguishable histories. |

Minimum state includes trainer/battle mode and AI flags, both parties/order, species/level/nature/IVs/stats/moves/PP/items/Abilities, HP/status/volatile/field effects, disabled/locked/last moves, counters and used-item history; S3 says EVs are removed, so do not import generic EV assumptions. Capture RNG state and relevant timing/other streams locally when available. Start with small boundary cases rather than a full personal campaign.

**Validation strength:** a sample of 65,536 returned values or initial states is not an exhaustive 32-bit seed sweep. Holding low bits fixed covers only one slice; even all seeds do not cover all histories/inputs. Replaying a fixed seed checks that execution only. Statistical intervals require a justified sampling distribution and do not rule out rare outcomes or establish support completeness, sure victory, or a zero-risk certificate. Version-matched source/proof can establish exactness or conservative bounds; exhaustive finite execution can certify only its explicitly complete input domain. A random-seed prior and any conditional updates must be stated.

## 9. PP exhaustion, Struggle, and whole-battle termination

### What the inspected sources actually establish

**Published RnB move data, not a build proof:** [S4 Struggle, lines 2947–2965](https://github.com/dekzeh/runandbundex/blob/ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab/moves/battle_moves.h#L2947-L2965) has a compile-time fork. With `B_UPDATED_MOVE_DATA >= GEN_4`, accuracy is zero (engine “always hit” convention), its effect is `EFFECT_RECOIL_HP_25`, and it is Protect-affected. The alternate branch has ordinary `EFFECT_RECOIL_25`. The published file does not establish the shipped configuration. S3's Gen 8 fallback supports the modern interpretation **as documentation**, not as executable verification.

**Upstream 1.3.0 only, S5/S9:**

- `battle_util.c:279–285` substitutes Struggle when `noValidMoves` is set and marks no PP deduction. This is a **move-execution** path, not a statement that every legal turn spends PP or that switching is forbidden at zero PP.
- The main upstream move PP reduction is `battle_script_commands.c:1903–1964`: Pressure can raise the deduction and no-PP-deduct markers bypass it; PP is clamped at zero. This reinforces that a single generic “subtract one every turn” model is not a termination argument.
- `battle_scripts_1.s:5816–5820` applies the max-HP-quarter recoil effect. `battle_script_commands.c:3435–3444` uses `max(1, floor(maxHP/4))`, with a Parental Bond adjustment. `battle_scripts_1.s:7945–7955` bypasses Rock Head's normal recoil exemption specifically for Struggle and checks whether the attacker faints afterward. **Rock Head is therefore not a demonstrated upstream Struggle escape.** Whether other abilities suppress recoil in the shipped RnB build still needs a trace/source check; do not infer a Magic Guard exception or protection without one.
- Recoil is attached to the attack/effect script, which includes attack cancellation, accuracy/protection, and damage/effect processing—not an unconditional quarter-HP tax whenever a turn passes. Actual “unable to act,” protected, no-target, Substitute, immunity and ability paths must be checked against the supported build. Upstream explicitly skips ordinary type effectiveness for Struggle (`battle_util.c:9597–9601`): a generic “switch to Ghost” loop is **not** established.
- There are actual **upstream resource-renewal mechanisms**, not just hypothetical unlimited bags: PP-restoring held items (`battle_util.c:7123–7160`); Harvest restoring a used berry in sun or on its random check (`4888–4899`); Recycle returning the recorded used item (`battle_script_commands.c:13915–13925`); Transform setting copied move PP to at most five (`11678–11682`). S4 includes Recycle (`5023–5039`) and Transform (`2581–2595`), but presence of move data does **not** prove reachable teams/items/abilities, shipped semantics, or a sustaining loop.
- Team exhaustion is separate from individual fainting. `battle_script_commands.c:4317–4394` totals party HP and sets loss/win flags. In that upstream revision `B_OUTCOME_LOST=2`, `WON=1`, `DREW=3`; if both totals are zero at this check the OR is 3. `battle_main.c:443–447` dispatches `DREW` to the loss handler. Ordering of the check versus replacement, recoil, Destiny Bond, Explosion or residual damage can affect which outcome is reached. This is **not** a confirmed RnB draw adjudication rule.

S3 documents set mode, inaccessible bag during trainer battles, permanent ability weather/terrain and consumed/removed held items not automatically restored. These narrow the obligations (no assumed unlimited bag; no automatic post-battle berry return) but **do not say in-battle Harvest/Recycle never works**. Permanent weather can matter to renewal. The AI reference explicitly allows PP-stalling switches and leaves Perish Song switching unknown (S1:26–45).

### Why the proposed argument is not yet a theorem

The valid local implication is conditional: if a Pokémon repeatedly executes recoil-applying Struggle, takes at least one net HP of loss per such execution, cannot restore that loss indefinitely, and executes enough such attacks, it faints in finitely many of those executions. Rounding matters; “four turns” is not a general bound. This implication does not show that those executions are inevitable, or that a replacement team is eventually exhausted.

A whole-battle proof for the supported domain must establish all of:

1. **Eventual action/resource progress:** legal switching, action prevention, move locks, recharge and failures cannot avoid depletion/progress forever under the actual CPU rules and selected player plan. A player's switches do not consume move PP, and the documentation permits CPU switches, so “player PP decreases every turn” is invalid.
2. **No unaccounted renewal:** include initial PP on every team member, held-item ownership and used-item slots, restoration, healing, switching/reset effects, Transform/copy behavior, and relevant histories. Bound renewal, or establish that a reachable combination still cannot sustain an execution.
3. **Eventual effective Struggle/net loss:** verify the shipped recoil convention, minimum rounding, ability/protection/failure handling, and that healing or switching cannot replenish the relevant total resource indefinitely.
4. **From faint to battle end:** a finite nonreviving roster and unavoidable repeated progress to further faints, with legal replacements and doubles ordering accounted for. A first faint is not battle termination. If revival/special battle scripts exist in scope, bound them too.
5. **Correct terminal classification:** both-party exhaustion, last-mon recoil, mutual residual faints, Destiny Bond/Explosion and Perish Song must be adjudicated by actual game rules. A terminating defeat/draw fails sure eventual **player victory** and an individual player faint already violates 0% whole-battle faint risk.

No source/fixture in this investigation establishes all five for Run & Bun. **No actual reachable infinite RnB execution was reproduced or proven either.** Harvest/Recycle/Transform are concrete source-backed mechanics to validate, not asserted RnB infinite-battle counterexamples. A legal owned set, held item availability, trainer encounter, CPU response and complete repeating resource/history state would all be needed for such a counterexample.

Likewise, an apparent cycle in a simulator that forgets PP/items/history is not a game cycle. Nor may an infinite sequence of unlucky independent coin flips be declared feasible in the actual game without checking the real deterministic RNG/input transitions. Positive probability of each finite prefix does not by itself prove a realizable infinite engine trace. Conversely, probability zero does not excuse a feasible infinite modeled execution under #132's sure-victory contract.

**Required termination evidence:** lawful local fixtures for all-PP-empty singles and doubles; zero-PP switch eligibility; blocked/cancelled Struggle; recoil rounding with relevant abilities; repeated switches retaining bench PP/HP; Leppa + Harvest/Recycle and Transform where legally available; all replacement choices; simultaneous last-faint ordering. To claim an infinite battle, supply a reachable legal complete-state loop (including finite resources and relevant RNG/history/input state) or another valid infinite-execution proof. To claim universal termination, supply a version/domain-matched progress argument that covers every feasible execution—not a long emulator run, arbitrary turn limit, or almost-sure simulation result.

**Disposition:** whole-battle termination remains **unresolved / incomplete**, not certified. This blocks blanket sure-victory coverage, but need not block an individually verified finite battle plan whose complete supported execution set all ends in victory and satisfies faint-risk tolerance.

## 10. Reproducibility checklist (bounded)

1. `git hash-object docs/ai.md` -> `75692b00e19d23bcc7082543e0fa456ed96996e4` (matches S1 repo copy).
2. Compare to the mirror: `gh api "repos/pranavmenonx/PokemonRunAndBunHelper/contents/AI%20Document%20for%20RnB%20(1.07).txt?ref=d6c68c2cbfb839a6de306adabbfbfe6dce7db2c7" --jq .content | base64 -d | diff -w --strip-trailing-cr - docs/ai.md` (not a proof of complete semantic equivalence).
3. Run the lineage loop in section 4, replacing the moving `dekzeh` default with `?ref=ec19ad0b0363cbab39657a116ddf9b6c7f18f3ab` for reproducibility.
4. Inspect upstream at the pinned tag, e.g. `gh api "repos/rh-hideout/pokeemerald-expansion/contents/src/battle_ai_main.c?ref=expansion/1.4.1" --jq .content | base64 -d | sed -n '387,483p'` (no files written).
5. Run the Python in section 5c; its domain is uniform 16-bit integers, **not an RnB battle reproduction**.
6. For termination, inspect S9 at the immutable links and line ranges in section 9. No emulator reproduction was attempted because no lawful RnB executable/test harness was supplied. No dependencies or tooling were installed.

## 11. Limitations

- Everything about RnB behaviour rests on one community document plus structural inference. The document explicitly claims it may be wrong or incomplete.
- No version-matched RnB AI/engine code was located; private docs, Discord and videos/recordings were not investigated. No emulator was run.
- Upstream tags other than 1.3.0/1.4.1 were only sampled by grep; line numbers for 1.4.1 and 1.3.0 differ and each citation names its tag.
- The lineage fingerprint uses only one data file. A closer upstream commit between tags (not a tag) is possible.
- Search snippets about release dates or forks were not used as evidence; they cannot validate a mechanics claim.
- Nothing here validates the repo's own implementation. In particular, the existing code's treatment (singles excludes bench <=25% HP; doubles filtering/switch incomplete) is **not** supported by any source found.

## 12. Recommended resolution and handoff

Resolve the **research question**, not the outstanding mechanics: keep S1 as the primary documented AI reference unless contradicted by version-matched game evidence; carry its omissions and version gaps as unsupported/incomplete. Public sources establish useful score/switch hypotheses, arithmetic and upstream mechanisms, but do not yet justify unconditional exact CPU-action probabilities, certified whole-battle faint-risk bounds, or a universal PP/Struggle termination guarantee.

For the first milestone, editable state, CPU probabilities, damage and next-turn outcomes must each expose their evidence scope and incomplete cases. Long-term branching battle plans must preserve all feasible nonzero outcomes and joint dependence, observe the CPU/player-information distinction, meet whole-battle faint-risk tolerance (default 0%), and ensure sure eventual player victory. Neither estimates, probability-1-only termination, unsupported pruning, nor exhausted computation qualify. No architecture/search algorithm or artificial battle-turn cap is selected here.

**Precise remaining decisions/evidence requests (not speculative product questions):**

1. Which exact RnB release/patch/build is the initial supported ruleset? S1 says 1.07, but a build/hash is still missing.
2. Can a maintainer supply an authorized source-level AI/mechanics audit or locally replayable lawful fixtures with scores and RNG-call traces? Without it, numerical exactness and completeness remain unsupported in the listed cases.
3. Which legal player sets/items and trainer battle modes form the initial evidence domain? This is needed to establish whether concrete renewal and doubles/switch interactions are reachable, not permission to silently drop feasible actions within that domain.

Termination requirements themselves are **already decided** by #132; do not reopen “sure versus almost-sure” as a choice. If the requested source/fixtures are unavailable, explicitly leave the affected cases unresolved and nonqualifying rather than invent a probability or certify a risk bound.
