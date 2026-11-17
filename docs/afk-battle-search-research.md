# Controlling battle-search branching without invalid risk claims

Research for [Identify search algorithms that control battle branching without invalid risk claims](https://github.com/tnclark8012/runbuncalc/issues/128), under
the map [Design an offline-capable Run & Bun battle-planning companion](https://github.com/tnclark8012/runbuncalc/issues/113). Investigated
2026-11-17 against repository revision
`7f3cb4c4a13e0efd2be5ce77a016d9f27bd7b1dc`.
This is a throwaway research-branch handoff, not an implementation, architecture
decision, performance result, or proposal to merge this branch.

## Recommendation in brief

Benchmark two policy-search combinations and one optional discovery front end:

1. **Explicit stochastic AND/OR graph, exact successor aggregation, transposition
   reuse, and bounded verification.** Begin with exhaustive tiny instances and
   incremental finite-depth expansion; qualify only complete policies or prefixes
   with already verified continuation policies. This is the correctness baseline.
2. **The same graph/verifier, with LAO*-style partial-policy expansion or
   BRTDP-style bound-gap-guided trials.** Compare these expansion schedules rather
   than assuming their original stochastic-shortest-path theorems apply to this
   constrained battle objective. Cycles, termination, observation restrictions,
   and bounds need explicit treatment.
3. **Optional heuristic/beam/MCTS discovery feeding that verifier.** Use it to
   rank teams, held-item assignments, and actions, not to discard feasible outcomes
   from qualification. Add it only if it improves verified throughput, not merely
   apparent win rate.

Use lazy, resumable preparation search outside policy search. Stop at the first
qualifying team and policy; global optimality is unnecessary. None of these
combinations has demonstrated phone feasibility here. A server remains undecided.

## 1. Binding product/evidence requirements

These are constraints, not choices made by this report:

- [Define probability fidelity and the meaning of a trustworthy risk claim — resolution](https://github.com/tnclark8012/runbuncalc/issues/116#issuecomment-6902090262):
  include every feasible nonzero modeled outcome; CPU probabilities use the AI's
  information, but player actions use only currently observable information.
  Qualification requires victory across every feasible modeled outcome and
  whole-battle faint risk within tolerance. Exact results, certified bounds,
  estimates, unsupported mechanics, and incomplete search are distinct.
- [Define legal team preparation and player control over recommendations — resolution](https://github.com/tnclark8012/runbuncalc/issues/117#issuecomment-6908602775)
  and [Define legal team preparation and player control over recommendations — amendment](https://github.com/tnclark8012/runbuncalc/issues/117#issuecomment-6950200116):
  consider retrievable owned Pokemon subject to exclusions and fainted-state
  rules, including the exact `Fainted` box fallback; actual levels/stats, current
  HP/status/PP and known moves; player-set level cap with over-cap flags, not
  clamping. Preparation is team selection and reallocating known owned held
  items, not healing, leveling, restoring PP, reviving, or teaching moves.
  Items on excluded/off-team Pokemon remain available; never exceed total
  bag-plus-held counts. Require verified encounter selection limits and necessary
  facts; otherwise withhold the affected recommendation.
- [Define useful automatic recommendations under finite computation — resolution](https://github.com/tnclark8012/runbuncalc/issues/118#issuecomment-6950171999):
  local, progressive, interruptible search; first actionable candidate within
  10 seconds **when feasible**, default five minutes **active computation**, then
  pause/continue; preserve exploratory results and stop at first qualification.
  Fixed selected Pokemon and explicit held items, including **no item**, are
  immutable in check-team completion. A full fixed team is checked unchanged.
  Revalidate after edits; old-input work must not overwrite edits.
- [Glossary](../GLOSSARY.md): faint risk is the probability of **at least one**
  player Pokemon fainting over the **entire battle**; risk tolerance defaults to
  0%. A branching battle plan is not a single favorable line.
- [ADR 0001](adr/0001-capacitor-app-and-native-save-access.md) selects Capacitor
  and native save access under `app/`, with Android 17/API 37 minimum, **not** a
  simulator/search architecture or background-service contract.

The first useful product milestone remains editable state, CPU-action and
next-turn probabilities, calculations and manual exploration
([Design an offline-capable Run & Bun battle-planning companion](https://github.com/tnclark8012/runbuncalc/issues/113)); automatic
full-battle qualification must not block it.

## 2. Formal target: a preparation plus an implementable policy

The following is proposed mathematical framing, derived from those requirements.

For a fixed legal preparation, let `s` be sufficient physical state and relevant
history, `a` a legal player decision made **before** unrevealed CPU choices, and
`P(s', o | s, a)` the modeled joint successor/observation distribution. CPU
behavior is stochastic according to validated AI logic, not a second optimizing
player by default. Player choices are OR nodes; stochastic outcomes are weighted
AND obligations. In doubles, joint legal actions and targets belong to one
decision; they are not independent choices if legality couples them.

A plan `π` must assign the same action to indistinguishable observable histories.
An MDP is appropriate only after proving the chosen player-visible state is
sufficient. If hidden persistent state influences future behavior, use an
information state (for example a belief over hidden states with justified
probabilities) or a sound robust abstraction; do not let an omniscient MDP choose
different actions for hidden cases the player cannot distinguish. Do not invent
a prior over unknown mechanics. A robust uncertainty set can support a bound
only when its coverage is justified. See [P1] for policy quantification.

Attach a monotone monitor `f = hasAnyPlayerPokemonFainted` to the state. For a
**fixed policy**, its whole-battle risk satisfies the reachability equations:

```text
Rπ(s, true) = 1
Rπ(victory, false) = 0
Rπ(s, false) = Σ P(s', o | s, π(observable history))
                    Rπ(s', false OR playerFaintsDuringTransition)
```

In cyclic graphs these equations require the appropriate reachability solution,
not arbitrary fixed points. Risk starts at the selected battle input; already
fainted/ineligible preparation is rejected by the factual constraints. A live
battle restart must state its scope: risk from the imported current state is
not retroactively a bound for unrecorded earlier play.

Continue the victory analysis after a faint when tolerance is positive. Making
faint an absorbing failure is useful for computing risk but must not erase the
physical continuations needed to establish that the same policy still wins.
Keep risk and victory monitors separate, or use a product construction.

**Important objective traps:**

- `min P(faint)` alone can select perpetual stalling; `max P(win)` alone can
  ignore the faint tolerance. Separate optimal values may belong to incompatible
  policies. Qualification needs **one witnessed policy** satisfying both.
- Minimizing expected faints is not the probability of any faint. Nor is
  `1 - winProbability` the faint risk.
- Multiplying unconditional per-turn safety estimates is invalid. The chain rule
  multiplies safety **conditional on the entire previous safe history**, including
  the policy's observation-dependent actions. Direct reachability avoids this
  bookkeeping trap.
- A most-likely line says nothing about uncovered policy branches. CPU behavior
  probabilities must not be renormalized after deleting rare outcomes.
- PRISM's `P<=τ [F faint]` on an unrestricted MDP universally quantifies over
  its nondeterministic policies; this is not the existential question "find
  a player plan within τ." Synthesize a witness under the constraints and
  verify the fixed policy (or explicitly constrain all remaining choices). [P1]

### Termination: do not silently weaken "every feasible outcome"

The resolutions do not explicitly distinguish **sure** eventual victory from
**almost-sure** victory. A supported self-loop with probability 1/2 and victory
with probability 1/2 has victory probability 1 but an infinite supported stalling
execution. Whether that execution counts as a feasible outcome matters.

Until clarified, report sure finite termination separately from almost-sure
termination; do not label an almost-sure-only result as the required guarantee.
An acyclic reachable policy graph or well-founded progress argument can establish
sure victory. On a finite graph, absence of reachable non-victory bottom SCCs
establishes almost-sure victory for a fixed policy, **not** sure victory. A
reachable cycle still permits indefinite supported executions even with exits.
These are different checks.

A depth/turn budget is a **computation** boundary, not a game loss and not an
invented battle turn limit. An unfinished suffix remains unresolved. Count
stalling, draws, player/CPU exhaustion, and end-component behavior explicitly;
do not assume PP always provides strict progress without a mechanics proof.
LAO* supports cyclic solution graphs [A1], but that does not make every cyclic
policy a winning or proper policy. LRTDP's original reachability assumptions
are not automatically true for losing battle states [A3].

## 3. What can safely reduce the branching?

| Technique | Classification | Required justification / common failure |
|---|---|---|
| Coalesce random events producing the identical sufficient successor **and observation** for a fixed action | Exact-preserving | Sum their actual probability masses. Preserve event monitoring and any remembered observation. Never count each nominal roll as a unique state. |
| Cache identical sufficient states / transition kernels | Exact-preserving, once identity is proved | Keep model/input versions, decision phase, all future-relevant history, and policy memory. Equality is semantic, not a pretty-printed string. |
| Coarser symmetry/bisimulation quotient | Proof-required exact reduction | Same property labels, corresponding legal actions, and equal probabilities into every equivalence class; preserve observation-consistent policies. [E1] |
| Short-circuit an action with a proved losing supported branch | Exact rejection for all-outcome victory | The branch must be genuinely feasible and the loss proved, not depth exhaustion. Does not reject other actions or teams. |
| Risk bounds and branch-and-bound | Certified pruning | Reject a candidate policy if its rigorous risk lower bound exceeds tolerance; accept risk only if its upper bound is within tolerance. Optimal-value bounds and fixed-policy bounds are not interchangeable. |
| Remove a player action or preparation by dominance | Proof-required | Need a policy-transfer/simulation argument preserving victory, risk and observations. More HP, damage, speed or team size is not generally monotone. |
| Best-first ordering, iterative deepening, heuristic team ranking | Exploration-only unless coupled to a proof | Ordering is harmless; permanently removing candidates loses completeness. A finite budget does not prove impossibility. |
| Beam search, progressive widening, MCTS/rollouts, nominal/min/max-roll substitutes | Discovery-only as ordinarily used | Qualify separately against every supported modeled outcome. Sampling may guide expansion, not justify omitted rare mass. [S1] |
| Truncate low-probability branches | Bound-required, never silent | Record conservative unresolved reach probability and outcome obligations. Renormalization is unsound. A small faint-risk allowance cannot establish victory on an unknown branch. |

### Exact outcome aggregation is not "sixteen branches per hit"

For a synthetic uniform 16-roll attack, suppose four roll indices produce the
same full successor and observation; their combined probability is `4/16`, not
`1/16`, and not four distinct nodes. Rounding, HP clipping at zero and other
effects can collapse additional outcomes. This example does **not** establish
Run & Bun's roll distribution: that belongs to
[Validate game AI and mechanics evidence for probability claims](https://github.com/tnclark8012/runbuncalc/issues/124).

Aggregation is by resulting semantics, not raw damage alone. Equal total damage
across different hit sequences can differ because of berries, contact effects,
per-hit boosts, item consumption, recoil, secondary effects, or faint timing.
Do not merge such sequences before resolving those consequences. Also establish
the joint distribution of accuracy, critical hits, ties, multi-hit counts,
secondary effects, AI scoring draws and actual attack RNG: multiplication of
marginals requires conditional independence. A compressed representation may
avoid materializing every roll tuple; it still owes exact multiplicity and joint
probability preservation.

### A sufficient key is larger than active HP

Audit reads of the validated transition model to derive a canonical key. At
minimum investigate:

- Stable individual Pokemon identities, active slots, ordered bench and relevant
  bench HP/status/PP/items, known moves, stats, boosts, ability/form/type changes,
  consumed items and battle-limited resources for both sides.
- Field/side state, hazards and durations, weather/terrain, traps, screens,
  turn/subturn phase, move ordering/tie state, selected joint actions where
  relevant, and forced versus voluntary replacement decisions.
- Volatiles and counters: sleep/toxic/confusion, charging/locking/recharge,
  protection chains, last relevant moves/actions, first turn out, damage taken
  this turn, switch history, and AI memory. This is an audit checklist, not a
  claim all mechanics are supported or these are exhaustive.
- Faint monitor; objective/horizon if any; sufficient observed history or
  policy-controller memory; preparation restrictions and immutable input/model
  version. Include a remaining search horizon in a **horizon-limited value**
  cache, but not needlessly in a horizon-independent physical transition cache.
- Turn number only where mechanically or policy relevant; an unbounded absolute
  counter can defeat merging even when no future behavior reads it. Remove it
  only after proving that irrelevance.

If actual PRNG state/correlations are relevant, either model them with their
information restrictions or justify the stochastic abstraction; inaccessible
PRNG state is not information the player's policy may use.

Caching a transition kernel is easier than caching a best policy/value. For
example, a cached scalar at tolerance 5% cannot be reused as a certificate at
0%. If exploring trade-offs, cache a witnessed feasible set/frontier of
victory/risk outcomes or otherwise preserve the policy constraints. Distinct
histories may reuse physical transitions yet still require different
observation-controller contexts.

Dominance deserves particular suspicion: lower HP can activate a berry or
ability, recoil changes survival, speed can change order, and any HP/stat change
can change AI scoring. Different bench orders can change switching. An exact
duplicate-action kernel is a safer first reduction than "this attack does more
damage" or "this Pokemon has better stats."

## 4. Shortlist and the boundaries of its guarantees

### A. Explicit incremental AND/OR search + fixed-policy verifier

Maintain a graph shared across policy candidates. Enumerate legal player actions
and exact aggregated chance successors lazily. Use exhaustive dynamic programming
for tiny finite-horizon reference models, then incremental expansion with
unresolved boundary nodes. Iterative deepening and action ordering give useful
prefixes; a verified winning suffix or complete policy closes an obligation.

For a fixed policy in an acyclic explored graph, use boundary risk interval
`[0,1]`, terminal risk values as above, and weighted interval backups. If explored
terminal faint mass is `b` and disjoint first-unresolved-boundary reach mass is
`u`, then `Rπ ∈ [b, b+u]`. This is a conservative interval, not an estimate.
In a graph with repeated visits, do not sum each visit's probability as if it
were a disjoint event: solve first-hit/reachability equations or use a justified
conservative bound. Keep victory obligations separately.

On a complete finite rational fixed-policy graph, exact linear-system solving
with graph reachability/SCC analysis is a useful tiny-instance oracle; choose
the correct boundary components before solving, since stalling can make the
naive system singular. On larger graphs, a sound interval method can be used
only with validated initialization, graph treatment, and numeric enclosure.
Small successive-iterate differences alone are not certified error bounds.
[P2]

**Why first:** easiest place to detect probability loss and incorrect merging;
same verifier serves manual candidates and fixed-team checking. **Failure
mode:** the explicit graph can still explode and a frontier interval can stay
too wide to qualify anything. There is no speed claim.

### B. Heuristic partial-policy search with certified bounds

LAO* generalizes AO* to policies containing loops and can avoid evaluating the
entire state space from a designated start state [A1]. BRTDP maintains upper
and lower values and focuses trials on states important to the current policy
with a large gap [A2]. LRTDP adds solved labels to RTDP, but its original
convergence claims require admissible initialization and stated goal-reachability
assumptions [A3]; losing states and improper stall policies need special handling.

Benchmark **LAO*-style versus BRTDP-style expansion on the same aggregated graph
and verifier**, rather than implementing several unrelated full engines.
Heuristic ordering may be optimistic; certificate bounds must be admissible in
the correct direction. For risk minimization, `0` is a trivial lower bound;
`1` is a trivial upper bound. An optimistic relaxation that grants extra player
power can lower the optimum risk, but it does not prove the real policy safe.
A concrete fully evaluated valid policy gives an achievable upper bound only
for the objective/constraints it actually satisfies.

Original LAO*/BRTDP results concern their specified MDP/SSP objectives and
initialization/properness assumptions, not automatically a conjunction of sure
victory, an observation-consistent strategy, and a chance constraint. Sampling
in BRTDP chooses where to compute; sound Bellman backups still require the
known distribution or rigorously bounded unexpanded mass. A sampled backup is
not made exact by the algorithm's name. SCC/end-component analysis and correct
reachability bounds are needed; naive upper iteration can remain at 1 on loops.

**Why second:** aligns with interruption and selective expansion without
silently deleting rare outcomes. **Failure modes:** weak initial bounds,
expensive successor generation, hidden-state information leakage, cyclic bound
nonconvergence, or attractive risk-minimizing stall policies.

### C. Optional discovery + rigorous qualification

Beam/MCTS/heuristic rollout can propose a preparation, a partial plan, and a
priority ordering for unexpanded actions. Shared exact transitions can reduce
duplicate verifier work. Restart or repair incomplete policies when the
verifier exposes a bad/undefined branch. After edits, re-establish affected
claims under a new immutable input identity.

An evaluation from zero observed faints does not prove zero probability.
Statistical confidence is not the exact/certified guarantee required here.
UCT also has constructed poor deep-tree behavior; it is not a finite-budget
performance promise [S1]. Discovery success is measured by **qualified plans
per budget**, separately from exploratory candidates.

**Why optional:** may locate useful actions/teams without enumerating every
preparation; cannot solve the verification bottleneck by itself. Compare
against simple deterministic ordering before paying for rollout infrastructure.

## 5. Preparation is an outer constrained search, not another chance layer

Generate legal team completions lazily. Canonicalize subsets of distinct owned
Pokemon only where order has no battle effect; lead selection and relevant
party order remain decisions. Generate held-item allocations from a multiset
of known counts, decrementing supply including locked assignments. Interchanging
identical copies of the same item need not generate another allocation, but
interchanging individual Pokemon is not automatically a symmetry.

For fixed partial-team checking:

1. Validate locked Pokemon eligibility, chosen team size, encounter maximum,
   level-cap input and ownership facts before search. An invalid locked choice
   is an actionable validation result, not a license to substitute.
2. Preserve each fixed Pokemon and its explicit item or no-item assignment;
   fill only remaining slots to the chosen size. Do not silently add Pokemon
   to a deliberately smaller team, heal them, or change known moves.
3. If all slots are fixed, run policy search only. For partial/unconstrained
   cases, schedule completions fairly enough to avoid spending the entire
   budget on one hard team; sharing and scheduling are benchmark hypotheses.
4. Preserve candidate preparation and policy together. They are alternative
   choices, **not** probabilistic outcomes whose win rates can be averaged.
5. Cache only under compatible preparation/model facts; different item counts
   or actual HP/PP can invalidate legality or continuations. Reuse kernels for
   identical local states when sound, not every prior qualification wholesale.

Simple move coverage/AI-aware scoring may rank candidates. Type coverage,
damage scores or a sampled loss cannot prove a team dominated or impossible.
For whole-roster impossibility, every legal completion and policy must be
excluded by a complete/certified argument. Early discovery stopping has no such
claim. Held-item and team combinations can dominate total time even if a fixed
team is easy; report the layers separately.

## 6. Repository evidence: mechanisms to reuse, guarantees not to reuse

All paths below refer to the inspected revision; no production files were
changed. These are inspection findings, not claims established by running a
game-fidelity suite. Existing code is evidence, not an architectural constraint.

| Location / mechanism | Reusable idea | Relevant limitation found |
|---|---|---|
| [`path-finder.ts`](../src/extensions/simulator/path-finder.ts): `findPlayerWinningPath`, `findPathGuaranteed`, `DecisionNode`, memo map | OR choices, weighted successors, a branching result, memoization | The recursive threshold search is not an all-outcome victory and whole-battle faint-risk verifier; details below. |
| [`turn-state.ts`](../src/extensions/simulator/turn-state.ts): `PossibleBattleFieldState`, `applyTransforms`, `runTurn` | Phase composition, explicit probabilities and action logs | Raw arrays expand branches eagerly. Plain `BattleFieldState[]` results receive weight 1 each, so multiplicity can encode decisions rather than normalized chance; adapters must distinguish them. No demonstrated exact roll-distribution kernel. |
| [`moveScoring.contracts.ts`](../src/extensions/simulator/moveScoring.contracts.ts): `BattleFieldState`, `PokemonPosition`, `Trainer` | Active/bench separation, field and volatile-state structures | `BattleFieldState.toString()` includes active displays only; bench formatter is unused. Display lacks field, boosts, PP, first-turn flag, turn number and much history. It cannot be a sound transposition key. |
| [`cpu-move-selection.ts`](../src/extensions/simulator/phases/battle/cpu-move-selection.ts) | Enumerating score outcomes and splitting ties is a starting point for CPU probability work | `PROBABILITY_THRESHOLD = 0.00001` prunes partial combinations and filters final move probabilities; rare mass is unaccounted. Marginal score-combination multiplication also needs validated dependence assumptions. |
| [`player-move-selection.ts`](../src/extensions/simulator/phases/battle/player-move-selection.ts), [`player-switch-in.ts`](../src/extensions/simulator/phases/switching/player-switch-in.ts) | Move/target candidates, singles switch candidates, forced replacements | Current code **does** add voluntary singles switches, contrary to the older observation in [Define probability fidelity and the meaning of a trustworthy risk claim](https://github.com/tnclark8012/runbuncalc/issues/116); only bench Pokemon above 25% HP are proposed, doubles switches are omitted, and positive heuristic move-score filtering restricts candidates. This is not a completeness proof. |
| [`execute-move.ts`](../src/extensions/simulator/phases/battle/execute-move.ts) | Ordered per-hit effects, item use and recoil | Execution reads `highestRollPerHitDamage` from a result computed with configured RNG strategy. Do not interpret that as exact enumeration of actual damage probabilities. |
| [`moveScoring.ts`](../src/extensions/simulator/moveScoring.ts) | Explicit AI considerations including last move | `lastTurnCPUMove` is passed as `undefined` with a TODO, although Sucker Punch and protection checks read it. Missing history affects the transition model before any search theorem applies. |

**Path-finder detail:** `findPathGuaranteed` has depth limit 20, uses a temporary memoized `LOSS` for
in-progress nodes, and does not include remaining depth in the memo key. It
normalizes action outcome mass by the surviving total, accepts a **strict**
`>` win-probability threshold (default 0.5), and returns the first such action,
not an all-outcome victory policy with a faint-risk certificate. Outcome child
keys use CPU action descriptions, so distinct damage/observation continuations
of one CPU action can overwrite each other in the map. Printed branches assume
equal probabilities. These mechanisms cannot be reused as qualification logic.
The zero-faint winning goal check also immediately rejects a player faint,
which is not the positive-tolerance objective.

[`docs/ai.md`](ai.md), headed Run & Bun **1.07**, is the binding documented AI
starting point per [Define probability fidelity and the meaning of a trustworthy risk claim](https://github.com/tnclark8012/runbuncalc/issues/116). Its introduction says it is not exhaustive; Perish
Song switching is explicitly unknown; damage/scoring draws and switch rules
need versioned confirmation. Exact arithmetic on an incomplete or wrong kernel
does not yield game-wide exact risk. [Validate game AI and mechanics evidence for probability claims](https://github.com/tnclark8012/runbuncalc/issues/124)
owns those evidence gaps; this report does not select or repair mechanics.

## 7. Proof obligations before displaying a qualifying plan

1. **Model closure:** every relevant mechanic and feasible outcome has a
   validated distribution, or justified uncertainty coverage and conservative
   bounds. Unknown is not probability zero. Confirm CPU scoring correlations,
   switches, ties, actual roll distributions, effects and terminal rules with
   [Validate game AI and mechanics evidence for probability claims](https://github.com/tnclark8012/runbuncalc/issues/124).
2. **Legal complete decisions:** moves, targets, voluntary switches, replacements,
   item/form decisions and doubles conflicts are covered or provably irrelevant;
   preparation honors the factual/fixed-choice constraints.
3. **Information consistency:** all choices are measurable from the observations
   available at that decision, including phase/order. No pre-reveal adaptation.
4. **Probability conservation:** per fixed player decision, successor masses plus
   explicitly bounded unexpanded mass cover 1. Decisions are not chance events.
   Preserve joint probabilities through aggregation and caching.
5. **Sound reduction:** prove sufficient key equality or bisimulation;
   verify observation labels and all monitors; justify every dominance/pruning rule.
6. **Same-policy victory and risk:** prove the required termination/victory
   property and `Rπ <= tolerance` for one complete policy. Unresolved mass can
   fit a positive risk budget but still leave an unproved victory obligation.
7. **Numerical enclosure:** use exact rational oracle arithmetic where practical
   and rigorous outward rounding/error accounting for certified numerical
   bounds; ordinary floats, a residual threshold, or printed rounding are not
   certification. At 0%, a small positive upper bound is not zero.
8. **Interruption validity:** persisted input/model IDs, phase, graph, frontier,
   policy and bound invariants reconstruct a consistent checkpoint. An
   interrupted expansion is either atomic or marked incomplete; interruption,
   eviction or heuristic cache loss never converts unknown to loss/success.

Use "no qualifying plan established" on exhaustion of time/memory or incomplete
model coverage. "No qualifying plan exists" requires complete/certified exclusion.

## 8. Reproducible benchmark handoff for [Measure local battle-search feasibility against branching and evidence requirements](https://github.com/tnclark8012/runbuncalc/issues/129)

No benchmark ran for this research-only ticket. The following are falsifiable
experiments for [Measure local battle-search feasibility against branching and evidence requirements](https://github.com/tnclark8012/runbuncalc/issues/129), not
performance promises or production design choices.

### Controls and records

Freeze harness revision, fixture JSON/hash, mechanics/evidence version, roster
and item counts, fixed choices, observation rules, objective/termination semantics,
risk tolerance, algorithm options, cache/bound policies and memory ceiling.
Publish synthetic generators, exact transition tables, reference answers and
seed list (for example 0–19); repeat deterministic runs at least three times.
Synthetic fixtures measure algorithms, not Run & Bun mechanics correctness.
Representative game cases must identify unsupported behavior and evidence from
[Validate game AI and mechanics evidence for probability claims](https://github.com/tnclark8012/runbuncalc/issues/124).

Run the same graph engine under: baseline exhaustive tiny solving; incremental
AND/OR without reductions; +aggregation; +transpositions; LAO*-style schedule;
BRTDP-style schedule; and, only if useful, simple beam versus MCTS discovery
before the same verifier. Keep action completeness and qualification criteria
identical; report reduction/preprocessing time too. Separate ablation tables
from final combined comparisons; do not multiply every option into a huge matrix.

Measure first **actionable exploratory** candidate (separately define its minimal
contents: legal preparation, root action, analyzed outcomes and unresolved
obligations), first **qualifying** policy, and default 300 seconds active
computation; checkpoint at the 10-second target. Record wall time as well.
Measure transitions generated before/after aggregation, unique sufficient states,
transposition hit rate, peak memory, graph/frontier size, rational/numeric work,
risk interval and unresolved victory obligations, preprocessing and team-allocation
time, pause latency, checkpoint bytes/time and resume overhead.

Record device/model/RAM/OS/API, runtime/build, temperature/thermal state and
foreground/background conditions. Report repeated runs and dispersion, not just
best time; deterministic correctness must agree across runs and schedules.
Android hardware is not supplied in this ticket. Desktop results must remain
desktop evidence. Coordinate lifecycle tests with
[Establish Android constraints for resumable offline background search](https://github.com/tnclark8012/runbuncalc/issues/130); foreground algorithm
experiments need not wait for background-service work.

### Concrete fixtures and hypotheses

| ID | Reproducible case | Reference result / falsifiable hypothesis |
|---|---|---|
| T1: roll multiplicity | Synthetic 1v1; 16 equally likely event indices partitioned into successor classes of sizes 8, 4, 3, 1; variant where all clip to KO; variant where same total damage triggers different per-hit items | Aggregated and raw exact answers identical; kernel sizes 4 and 1 in the first two variants; per-hit-distinct variant must not merge. Runtime gain is measured, not assumed. |
| T2: rare catastrophe | Root has probability `1/1,000,000` of unavoidable player faint but eventual victory in all cases; rest safe victory. Compare tolerances 0, `1/2,000,000`, `1/1,000,000` | First two reject that policy, equality accepts its risk; this catches threshold loss, strict comparison errors and false zero-risk certificates. A variant with rare unavoidable defeat must reject at **every** faint tolerance. |
| T3: information boundary | Hidden CPU choice attack/protect occurs after player decision; two hidden cases share one observation, but require incompatible preemptive responses. Variant reveals the difference before next decision | Omniscient solution must not qualify first variant; legitimate next-turn branching can qualify second. Verify the policy, not only scalar values. |
| T4: transpositions | Synthetic diamonds reconverge to identical full states; paired counterexamples differ only in bench item/HP/PP, first-turn flag, last move, hazard duration or faint monitor | Exact merging reduces repeated expansions in equal cases and never merges counterexamples. Compare oracle risks and extracted policies. |
| T5: cycles | Supported 1/2 self-loop + 1/2 victory; closed no-progress loop; two-state switch loop with eventual progress action; depth-21 guaranteed-win chain | Distinguish sure from almost-sure results; closed loop never qualifies. Depth cap is unresolved, not proof of loss. Bound schedules terminate or honestly retain a gap. |
| T6: coupled objectives | One policy wins surely with positive faint risk, one stalls with zero risk; variant with distinct win-optimal and risk-optimal choices | Never combine incompatible scalar optima into a certificate. Positive-tolerance plan continues after a faint and proves victory. |
| T7: preparation | Generator sizes 6, 12, 24 owned Pokemon; team size 3; 0, 1, 3 fixed slots; two copies each of two items; fixed no-item choice; excluded donor with item; low-HP actual state | No illegal/fixed-choice mutation; identical-copy permutations suppressed; report allocation counts and time separately. Lazy ranked completion may improve time-to-qualified-plan, or merely starve useful teams. |
| T8: branching stress | Parameterized 1/2 active slots, 2/4 move candidates per slot, 1/3/5 switch candidates, 2/4 CPU actions, depth 4/8/16, successor-class ratios 1/16, 1/4, 1, with/without reconvergence | Aggregation/reuse should help only where equivalence exists; selective schedules may reduce expansions but can lose to baseline on small or diffuse instances. Keep rare supported branches. |
| T9: suspend/edit | Pause at deterministic expansion counts and partial-phase boundaries; restart from checkpoint; edit a held item or HP mid-search; impose small memory ceilings | Continued and uninterrupted runs preserve the same certified intervals/policies for unchanged input; no stale results overwrite edits. Quantify lost work and serialization cost. |

Add a small curated set of real singles and doubles encounters with versioned
mechanics fixtures, fixed-team checks, fixed partial completion and unconstrained
selection. Include both a small-reconvergence-friendly case and a branching-heavy
stall/status/item case. Do not select only encounters already known to be easy,
nor claim every generated action tuple is legal. Verify legality in the fixtures.

**Decision gate:** retain the simplest combination producing reproducibly correct
and useful outputs under phone memory/time constraints. If only shallow/manual
exploration works, that remains a useful milestone; state exactly what automatic
scope is supported. If local qualification is slow, identify whether generation,
kernel fidelity, graph size or certification dominates before reconsidering
server search. A server cannot repair missing mechanics or invalid guarantees.

### Phone-first engineering hypotheses, not a selected architecture

Bounded batches, lazy chance expansion, deduplicated immutable states and compact
graph references may control memory and pause latency; measure the overhead
against straightforward arrays. Graph/SCC work, exact arithmetic and checkpoint
serialization may dominate on phone even when state count improves. A memory
ceiling can stop expansion or evict recomputable cache entries but cannot discard
unresolved obligations and then declare success. Fair scheduling across team
completions and time slices must retain the best candidate/proof status.

Persisting enough to resume is a correctness requirement, but uninterrupted
Android background execution/notification permission is a separate question for
[Establish Android constraints for resumable offline background search](https://github.com/tnclark8012/runbuncalc/issues/130).
Measure active computation independently of OS suspension. No automatic network
fallback or upload is authorized.

## 9. Remaining fog and precise follow-up questions

- **Termination semantics for the goals-led spec:** does "every feasible modeled
  outcome wins" require sure termination, or is almost-sure termination acceptable
  with explicit infinite-stall treatment? The distinction changes admissible
  policies and benchmark expectations; do not settle it by an algorithm default.
- **[Validate game AI and mechanics evidence for probability claims](https://github.com/tnclark8012/runbuncalc/issues/124) — kernel contract:** which versioned joint AI-scoring/actual-RNG laws,
  voluntary CPU switches, Perish Song behavior, history-dependent rules, doubles
  interactions and terminal draw/exhaustion rules are confirmed? Which unknowns
  admit bounded uncertainty and which prevent qualification?
- **Information contract:** precisely which live fields are visible at each
  action/replacement phase? If latent variables persist, what evidence supports
  their distribution? This decides MDP sufficiency versus information-state work.
- **[Measure local battle-search feasibility against branching and evidence requirements](https://github.com/tnclark8012/runbuncalc/issues/129) — device/fixture access:** which Android/API-37 device and curated encounter
  inputs are available? Until supplied, phone feasibility and game fidelity are
  explicitly unmeasured, not negative results.
- **Performance unknown:** are roll coalescence/transpositions common in actual
  battles, and does certification or outer preparation dominate? T1/T4/T7/T8
  distinguish these; do not infer savings from nominal branch count alone.

These are coordination questions for the goals-led specification, not architecture
decisions. Follow-up ticket creation and all issue/map lifecycle decisions remain
with the parent/driving developer.

## Sources and verification record

Access date: 2026-11-17. Direct HTTP fetches of the external paper/manual hosts
failed DNS in this environment. Paper claims below were checked against
**indexed excerpts returned from the primary author/publisher URLs**, not full
PDFs; no uninspected page numbers or full theorem applicability is asserted.
The two PRISM manuals were additionally read through `gh api` at the pinned
official-repository commit below after locating their current Markdown paths.
This limitation is why the shortlist proposes adaptations and proof obligations,
not a claim that a named paper already proves our constrained search correct.

- **[P1] PRISM, “The P Operator,” official manual**, sections *Nondeterminism*
  and *Numerical properties*. Verified policy/strategy interpretation and
  `Pmin`/`Pmax` quantification. [Live manual](https://www.prismmodelchecker.org/manual/PropertySpecification/ThePOperator);
  [pinned primary Markdown, lines 37–77](https://github.com/prismmodelchecker/prism/blob/edcf9e143aeb18194c6e4f40de68e751f8ad446a/doc/manual/PropertySpecification/ThePOperator.md#L37-L77).
- **[P2] PRISM, “Solution Methods and Options,” official manual**, sections
  *Convergence* and *MDP solution methods*. Verified the difference between
  successive-iterate stopping and from-below/from-above interval iteration.
  This supports the numerical-method distinction, not a blanket claim that any
  floating-point interval implementation is certified.
  [Live manual](https://www.prismmodelchecker.org/manual/ConfiguringPRISM/SolutionMethodsAndOptions);
  [pinned primary Markdown, lines 16–93](https://github.com/prismmodelchecker/prism/blob/edcf9e143aeb18194c6e4f40de68e751f8ad446a/doc/manual/ConfiguringPRISM/SolutionMethodsAndOptions.md#L16-L93).
- **[A1] Hansen and Zilberstein (2001), “LAO*: A heuristic search algorithm that
  finds solutions with loops,” Artificial Intelligence 129, 35–62.**
  Verified cyclic policy graphs, admissible-heuristic search, and the possibility
  of avoiding complete state-space evaluation. Weighted heuristic results are
  not automatically optimal. [Author PDF](http://rbr.cs.umass.edu/papers/HZaij01b.pdf);
  [publisher abstract](https://www.sciencedirect.com/science/article/pii/S0004370201001060).
- **[A2] McMahan, Likhachev and Gordon (2005), “Bounded Real-Time Dynamic
  Programming: RTDP with Monotone Upper Bounds and Performance Guarantees,”
  ICML.** Verified maintenance of lower/upper values, relevance/gap-guided
  exploration, monotone-bound initialization and guarantees associated with
  suitable upper-bound greedy policies. These are SSP results, not an
  off-the-shelf proof for constrained faint-risk policies.
  [Author-hosted PDF](https://www.cs.cmu.edu/~./ggordon/mcmahan-likhachev-gordon.brtdp.pdf).
- **[A3] Bonet and Geffner (2003), “Labeled RTDP: Improving the Convergence of
  Real-Time Dynamic Programming,” ICAPS.** Verified solved-state labeling,
  admissible initialization and explicit goal-reachable-from-every-state
  assumptions; stronger results also state monotonicity conditions.
  [Original proceedings PDF](https://cdn.aaai.org/ICAPS/2003/ICAPS03-002.pdf).
- **[E1] Givan, Dean and Greig (2003), “Equivalence notions and model minimization
  in Markov decision processes,” Artificial Intelligence 147, 163–223.**
  Verified stochastic bisimulation and preservation of block transition
  probabilities/rewards and policy correspondence in the quotient. Preserving
  faint/victory labels and observation restrictions is our additional
  application-specific obligation.
  [Author-hosted paper](https://cs.brown.edu/people/tdean/publications/archive/GivanetalAIJ-03.pdf);
  [publisher abstract](https://www.sciencedirect.com/science/article/pii/S0004370202003764).
- **[S1] Coquelin and Munos, “Bandit Algorithms for Tree Search.”** Verified the
  authors' constructed poor worst-case depth dependence for UCT; the paper
  supplies no whole-battle zero-risk qualification guarantee for this application.
  [Author-submitted paper](https://arxiv.org/abs/1408.2028),
  [PDF](https://arxiv.org/pdf/1408.2028).

Repository observations are directly traceable through the relative source links
above and the base revision. All benchmark results remain to be obtained.
