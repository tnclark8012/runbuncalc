// THROWAWAY: node src/extensions/simulator/prototypes/search-feasibility-129.mjs
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { cpus, totalmem, platform, release, arch } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const html = readFileSync(new URL("./search-feasibility-129.html", import.meta.url), "utf8");
const source = html.match(/<script id="search-kernel">([\s\S]*?)<\/script>/)[1];
runInThisContext(source);
const E = globalThis.BattleSearchExperiment;
const quick = process.argv.includes("--quick");
const report = {
  warning: "Synthetic desktop experiment only. No Run & Bun mechanics or Android performance qualification.",
  version: E.VERSION,
  kernelSHA256: createHash("sha256").update(source).digest("hex"),
  baseRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  command: `node src/extensions/simulator/prototypes/search-feasibility-129.mjs${quick ? " --quick" : ""}`,
  device: { platform: platform(), release: release(), arch: arch(), cpu: cpus()[0]?.model,
    logicalCPUs: cpus().length, hostMemoryBytes: totalmem(), runtime: process.version,
    conditions: "Shared Linux environment; load/thermal state uncontrolled; not Android" },
  activeBudgetMs: quick ? 300 : 300000,
  perCaseCapMs: quick ? 300 : 300000,
  limitations: [
    "Synthesis covers zero-faint sure-winning policies only; fixed-policy diagnostics also exercise positive risk.",
    "HP grouping is representative-guided discovery plus exact reachable-state verification, not a certified quotient.",
    "A failed coarse search retries exact HP before rejecting a team; successful candidates may require counterexample refinements.",
    "Completed-subtree caches survive checkpoints; active recursive call stacks are discarded and replayed.",
    "The verifier checks every supported exact successor for a proposed fixed policy; raw floating-point probabilities are not used.",
    "Only synthetic observable-state singles fixtures; no real encounter, doubles, hidden persistent-state inference or full item allocation.",
    "Tiny team combinations are enumerated eagerly, not lazily; preprocessing is measured and included in active time.",
    "The threshold oracle deliberately spans both sides of 70 HP; actual battle breakpoints would depend on integer HP and validated mechanics.",
    "No LAO*/BRTDP comparison yet; this first experiment compares human heuristics against a depth-first AND/OR baseline.",
    "No Android hardware, background lifecycle or thermal measurements. No phone-feasibility conclusion.",
    "Full runs allow five active minutes per case, but stop sooner at qualification or the 20,000 retained-state-record ceiling; quick runs allow 300 ms.",
    "Heap samples are shared-process snapshots, not isolated peak resident memory; graph storage counters omit stacks and serialized copies."
  ],
  diagnostics: [], runs: []
};
function record(name, actual, expected) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  report.diagnostics.push({ name, passed, actual, expected });
  if (!passed) throw Error(`Correctness oracle disagreement: ${name}: ${JSON.stringify(actual)}`);
}
for (const [tolerance, expected] of [[[0, 1], false], [[1, 2000000], false], [[1, 1000000], true]]) {
  const result = E.checkFixed("rare", { lead: "Risky victory" }, tolerance);
  record(`Rare risk at tolerance ${tolerance.join("/")}`, result,
    { sureVictory: true, faintRisk: ["1/1000000", "1/1000000"], qualifies: expected });
}
record("Supported infinite execution is not sure victory",
  E.checkFixed("cycle", { lead: "Repeat forever or win" }).qualifies, false);
const multiplicities = [8, 4, 3, 1].flatMap((count, i) =>
  Array.from({ length: count }, () => E.edge({ result: `class-${i}` }, 1, 16)));
record("Exact duplicate roll aggregation", E.aggregate(multiplicities).map(e => `${e.p[0]}/${e.p[1]}`),
  ["1/2", "1/4", "3/16", "1/16"]);
record("All rolls clip to the same KO", E.aggregate(multiplicities.map(e =>
  ({ ...e, state: { result: "win" } }))).length, 1);
record("Distinct item/PP/history/monitor state is not merged", E.aggregate([
  E.edge({ result: "win", item: true, pp: 2, lastMove: "a", fainted: false }, 1, 2),
  E.edge({ result: "win", item: false, pp: 1, lastMove: "b", fainted: true }, 1, 2)
]).length, 2);

for (const id of E.names) {
  const modes = ["baseline", "matchup", "ranges", "progress", "combined"];
  for (const mode of modes) for (let repeat = 0; repeat < 3; repeat++) {
    const wall = performance.now(), heapBefore = process.memoryUsage().heapUsed;
    const session = E.create(id, mode);
    E.run(session, report.perCaseCapMs);
    const expected = ["rare", "hidden", "cycle", "interior-trap"].includes(id) ? "not-established" : "qualified-synthetic";
    if (session.status !== "searching" && session.status !== "memory-boundary" && session.status !== expected)
      throw Error(`Reference disagreement for ${id}/${mode}: ${session.status}`);
    if (["uniform", "threshold", "interior-trap", "bait", "rare", "hidden", "revealed", "cycle", "chain", "hp-progress"].includes(id)
      && session.status !== expected) throw Error(`Tiny reference not resolved: ${id}/${mode}`);
    if (["fixed", "partial", "open", "stress"].includes(id)) {
      const locked = E.fixture(id).preparation[0].team.slice(0, id === "fixed" ? 3 : id === "partial" ? 1 : 0);
      if (session.candidate && !locked.every((p, i) => JSON.stringify(p) === JSON.stringify(session.candidate.preparation.team[i])))
        throw Error("A locked Pokemon or explicit no-item choice changed");
    }
    report.runs.push({
      id, mode, repeat, status: session.status, wallMs: performance.now() - wall,
      heapBefore, heapAfter: process.memoryUsage().heapUsed, stats: session.stats,
      inputSHA256: createHash("sha256").update(session.input).digest("hex"),
      candidate: session.candidate && {
        preparation: session.candidate.preparation, rootAction: session.candidate.rootAction,
        modeledRootOutcomes: session.candidate.modeledRootOutcomes, evidence: session.candidate.evidence
      },
      verification: session.verification, verdict: session.verdict
    });
  }
}
// Correctness oracles for the single change's key failure modes, not a production test suite.
const uninterrupted = E.run(E.create("threshold", "combined"), 1000);
let resumed = E.create("threshold", "combined");
E.work(resumed, 1000, 10);
const checkpointStart = performance.now(), text = E.serialize(resumed);
resumed = E.restore(text, resumed.input);
const checkpointMs = performance.now() - checkpointStart;
E.run(resumed, 1000);
record("Interrupted and uninterrupted exact answers", [resumed.status, resumed.verification],
  [uninterrupted.status, uninterrupted.verification]);
let staleRejected = false;
try { E.restore(text, E.create("threshold", "combined", { edited: true }).input); }
catch (error) {
  if (!error.message.includes("different inputs")) throw error;
  staleRejected = true;
}
record("Edited input rejects old checkpoint", staleRejected, true);
const limited = E.create("threshold", "baseline", { maxStates: 2 });
E.run(limited, 1000);
record("Memory boundary cannot produce qualification", limited.status, "memory-boundary");
report.checkpoint = {
  bytes: Buffer.byteLength(text), serializeRestoreMs: checkpointMs,
  uninterrupted: uninterrupted.stats, resumed: resumed.stats,
  replayVisitOverhead: resumed.stats.visits - uninterrupted.stats.visits,
  staleRejected
};
let stress = E.create("stress", "combined");
E.work(stress, 1000, 500);
if (stress.phase !== "verify" || stress.status !== "searching") throw Error("Expected an interrupted verification phase");
const stressCheckpointStart = performance.now(), stressText = E.serialize(stress);
stress = E.restore(stressText, stress.input);
const stressCheckpointMs = performance.now() - stressCheckpointStart;
E.run(stress, 10000);
record("Checkpoint during branching-heavy verification", [stress.status, stress.verification],
  ["qualified-synthetic", { sureVictory: true, faintRisk: ["0/1", "0/1"], unresolved: "0/1" }]);
report.verificationCheckpoint = { bytes: Buffer.byteLength(stressText),
  serializeRestoreMs: stressCheckpointMs, stats: stress.stats };
const raw = E.run(E.create("uniform", "baseline", { aggregate: false }), 1000);
const grouped = E.run(E.create("uniform", "baseline"), 1000);
record("Raw and aggregated outcomes agree", [raw.status, raw.verification], [grouped.status, grouped.verification]);
report.aggregationControl = { raw: raw.stats, aggregated: grouped.stats };
report.summary = [];
for (const id of E.names) for (const mode of ["baseline", "matchup", "ranges", "progress", "combined"]) {
  const rows = report.runs.filter(row => row.id === id && row.mode === mode);
  const times = rows.map(row => row.stats.activeMs).sort((a, b) => a - b);
  report.summary.push({ id, mode, statuses: rows.map(row => row.status),
    activeMs: { min: times[0], median: times[1], max: times[2] },
    expansions: rows[0].stats.expansions, verificationStates: rows[0].stats.verificationStates,
    refinements: rows[0].stats.refinements, peakStoredStates: Math.max(...rows.map(row => row.stats.peakStoredStates)) });
}
console.log(JSON.stringify(report, null, 2));
