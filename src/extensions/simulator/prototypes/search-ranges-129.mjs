// THROWAWAY: node src/extensions/simulator/prototypes/search-ranges-129.mjs
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { createHash } from "node:crypto";
import { cpus, platform, release, totalmem } from "node:os";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const source = readFileSync(new URL("./search-feasibility-129.html", import.meta.url), "utf8")
  .match(/<script id="search-kernel">([\s\S]*?)<\/script>/)[1];
runInThisContext(source);
const E = globalThis.BattleSearchExperiment;
const quick = process.argv.includes("--quick");
const budget = quick ? 500 : 300000;
const report = {
  warning: "Throwaway synthetic desktop range-proof study; no Run & Bun or Android feasibility claim.",
  version: E.VERSION,
  kernelSHA256: createHash("sha256").update(source).digest("hex"),
  baseRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  device: { platform: platform(), release: release(), cpu: cpus()[0]?.model,
    hostMemoryBytes: totalmem(), runtime: process.version, conditions: "Shared host; uncontrolled load and thermals" },
  budgetMs: budget, repetitions: 3,
  proofScope: [
    "Only zero-faint sure victory; every positive-probability raw event remains a universal obligation.",
    "Forward boxes retain exact non-HP state and an integer interval per teammate HP. Hulls overapproximate correlations and may introduce unreachable states.",
    "The selected action is uniform within each policy partition; split at all HP partition cuts, plus the synthetic 70-HP mechanics breakpoint.",
    "Whitelisted kernels are piecewise affine in HP with survival guards. Within a guard region, each supported event maps interval endpoints monotonically.",
    "Any endpoint guard/result mismatch, possible faint, missing policy action or unsupported kernel falls back to exact verification, never rejection based on a spurious abstract state.",
    "The gauntlet has a strictly decreasing lexicographic rank (remaining enemies, enemy PP, enemy HP); graph examples use decreasing node rank. Every represented successor must pass it.",
    "Zero risk follows from covering every event and every HP in each box, not from assigning probabilities to convex hulls. Positive-tolerance range verification is unsupported.",
    "Range proving is enabled only with coarse HP discovery; exact policies and exact fallback use the original exact checker.",
    "Every range-qualified policy is independently checked again with the exact checker; audit work is measured separately and excluded from range time.",
    "The record cap is a configurable experimental guard, not a byte limit. Heap snapshots are shared-process samples, not isolated peaks.",
    "Team preparation, toy move/PP/recoil laws, and all other original experiment limitations remain synthetic."
  ],
  runs: [], diagnostics: [], ceilingStudy: []
};
function assert(name, actual, expected) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  report.diagnostics.push({ name, passed, actual, expected });
  if (!passed) throw Error(`Oracle disagreement: ${name}: ${JSON.stringify(actual)}`);
}
function audit(session) {
  if (session.status !== "qualified-synthetic" || !session.candidate.evidence.startsWith("conservative")) return null;
  const check = E.restore(E.serialize(session), session.input);
  check.config.verifier = "exact";
  check.config.maxStates = 100000;
  check.status = "searching"; check.phase = "verify"; check.verificationMemo = {}; check.rangeProof = null;
  check.storedStates = Object.keys(check.representatives).length;
  const before = check.stats.activeMs, priorStates = check.stats.verificationStates;
  E.run(check, check.stats.activeMs + 30000);
  assert(`Exact audit: ${session.id}/${session.mode}`, [check.status, check.verification],
    ["qualified-synthetic", { sureVictory: true, faintRisk: ["0/1", "0/1"], unresolved: "0/1" }]);
  return { activeMs: check.stats.activeMs - before, states: check.stats.verificationStates - priorStates };
}
for (const id of E.names) {
  for (const mode of ["ranges", "combined"]) for (const verifier of ["exact", "interval"]) {
    for (let repeat = 0; repeat < 3; repeat++) {
      const start = performance.now(), beforeHeap = process.memoryUsage().heapUsed;
      const session = E.run(E.create(id, mode, { verifier }), budget);
      const row = { id, mode, verifier, repeat, status: session.status, stats: { ...session.stats },
        verification: session.verification, evidence: session.candidate?.evidence,
        wallMs: performance.now() - start, beforeHeap, afterHeap: process.memoryUsage().heapUsed };
      row.exactAudit = audit(session);
      report.runs.push(row);
      const expected = ["rare", "hidden", "cycle", "interior-trap"].includes(id) ? "not-established" : "qualified-synthetic";
      if (!["stress"].includes(id)) assert(`Tiny reference ${id}/${mode}/${verifier}/${repeat}`, session.status, expected);
    }
  }
}
for (const maxStates of quick ? [5000] : [5000, 20000, 80000]) {
  for (const [mode, verifier] of [["baseline", "exact"], ["progress", "exact"], ["combined", "exact"], ["combined", "interval"]]) {
    for (let repeat = 0; repeat < 3; repeat++) {
      const beforeHeap = process.memoryUsage().heapUsed;
      const session = E.run(E.create("stress", mode, { verifier, maxStates }), budget);
      report.ceilingStudy.push({ maxStates, mode, verifier, repeat, status: session.status,
        stats: session.stats, verification: session.verification, beforeHeap,
        afterHeap: process.memoryUsage().heapUsed, checkpointBytes: Buffer.byteLength(E.serialize(session)) });
    }
  }
}
let interrupted = E.create("stress", "combined", { verifier: "interval" });
E.work(interrupted, 1000, 50);
assert("Pause occurs during interval verification", [interrupted.phase, interrupted.status, !!interrupted.rangeProof],
  ["verify", "searching", true]);
const checkpointStart = performance.now(), checkpoint = E.serialize(interrupted);
interrupted = E.restore(checkpoint, interrupted.input);
const checkpointMs = performance.now() - checkpointStart;
E.run(interrupted, interrupted.stats.activeMs + 30000);
assert("Interval checkpoint resumes to a verified result", [interrupted.status, interrupted.verification],
  ["qualified-synthetic", { sureVictory: true, faintRisk: ["0/1", "0/1"], unresolved: "0/1" }]);
audit(interrupted);
report.checkpoint = { bytes: Buffer.byteLength(checkpoint), serializeRestoreMs: checkpointMs, stats: interrupted.stats };
report.summary = [];
for (const id of E.names) for (const mode of ["ranges", "combined"]) for (const verifier of ["exact", "interval"]) {
  const rows = report.runs.filter(r => r.id === id && r.mode === mode && r.verifier === verifier);
  const times = rows.map(r => r.stats.activeMs).sort((a, b) => a - b);
  report.summary.push({ id, mode, verifier, statuses: rows.map(r => r.status),
    activeMs: { min: times[0], median: times[1], max: times[2] },
    discoveryExpansions: rows[0].stats.expansions, exactVerificationStates: rows[0].stats.verificationStates,
    intervalBoxes: rows[0].stats.intervalBoxes, intervalFallbacks: rows[0].stats.intervalFallbacks,
    refinements: rows[0].stats.refinements, peakStoredRecords: Math.max(...rows.map(r => r.stats.peakStoredStates)) });
}
console.log(JSON.stringify(report, null, 2));
