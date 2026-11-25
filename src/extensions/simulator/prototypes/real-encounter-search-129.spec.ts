// THROWAWAY PROTOTYPE for issue #129 — not production code, never merge.
// Exact zero-faint, sure-victory AND/OR search on real Run & Bun encounter inputs, with an explicit
// mechanics list. Run:
//   npx jest --runInBand --runTestsByPath src/extensions/simulator/prototypes/real-encounter-search-129.spec.ts
// Set PROTOTYPE_BUDGET_MS to change the per-case active-computation budget (default 300000).
import { calculate, Field, Move, Pokemon } from '@smogon/calc';
import { getFinalSpeed } from '@smogon/calc/dist/mechanics/util';
import { writeFileSync } from 'node:fs';
import { cpus, platform, release, arch, totalmem } from 'node:os';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { gen } from '../../configuration';
import { OpposingTrainer } from '../../trainer-sets';
import { importTeam } from '../helper';
import { getBox } from '../playthrough/museum.collection';

// ---------- exact rationals (per-turn mass-conservation oracle only) ----------
type Frac = [bigint, bigint];
const ONE: Frac = [1n, 1n];
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const norm = ([n, d]: Frac): Frac => { const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const mul = (a: Frac, b: Frac): Frac => norm([a[0] * b[0], a[1] * b[1]]);
const add = (a: Frac, b: Frac): Frac => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const fr = (n: number, d: number): Frac => norm([BigInt(n), BigInt(d)]);
const isZero = (a: Frac) => a[0] === 0n;

// ---------- modelled move table (anything else is UNSUPPORTED) ----------
type MoveInfo = { acc: number | true; pp: number; prio?: number; self?: [number, number];
  target?: [number, number]; par?: number; brn?: number; flinch?: number; speDrop?: number;
  drain?: boolean; multi?: boolean; struggle?: boolean; wrap?: boolean; bugBite?: boolean; bounce?: boolean; status?: boolean };
// Stage index: 0 atk, 1 def, 2 spa, 3 spd, 4 spe, 5 acc, 6 eva.
const MOVES: Record<string, MoveInfo> = {
  'Absorb': { acc: 100, pp: 25, drain: true }, 'Bite': { acc: 100, pp: 25, flinch: 30 },
  'Growl': { acc: 100, pp: 40, status: true, target: [0, -1] },
  'Confide': { acc: true, pp: 20, status: true, target: [2, -1] },
  'Tackle': { acc: 100, pp: 35 }, 'Scratch': { acc: 100, pp: 35 },
  'Quick Attack': { acc: 100, pp: 30, prio: 1 }, 'Aerial Ace': { acc: true, pp: 20 },
  'Bubble Beam': { acc: 100, pp: 20, speDrop: 10 }, 'Leafage': { acc: 100, pp: 40 },
  'Magical Leaf': { acc: true, pp: 20 }, 'Sand Attack': { acc: 100, pp: 15, status: true, target: [5, -1] },
  'Baby-Doll Eyes': { acc: 100, pp: 30, prio: 1, status: true, target: [0, -1] },
  'Bug Bite': { acc: 100, pp: 20, bugBite: true }, 'Spark': { acc: 100, pp: 20, par: 30 },
  'Vise Grip': { acc: 100, pp: 30 }, 'Pin Missile': { acc: 95, pp: 20, multi: true },
  'Iron Defense': { acc: true, pp: 15, status: true, self: [1, 2] },
  'Ember': { acc: 100, pp: 25, brn: 10 }, 'Wrap': { acc: 90, pp: 20, wrap: true },
  'Bounce': { acc: 85, pp: 5, par: 30, bounce: true }, 'Hydro Pump': { acc: 80, pp: 5 },
  'Flail': { acc: 100, pp: 15 },
};
// Move index -1 is Struggle: used when no move has PP; never misses, recoil round(max HP / 4).
const STRUGGLE: MoveInfo = { acc: true, pp: 0, struggle: true };
const MODELLED_ABILITIES = new Set(['Shell Armor', 'Battle Armor', 'Sturdy', 'Cotton Down', 'Rattled',
  // Present but inert for these fixtures (no trigger exists in the encounter):
  'Keen Eye', 'Run Away', 'Swift Swim', 'Flash Fire', 'Blaze', 'Swarm' /* calc applies Swarm/Blaze */]);
const MODELLED_ITEMS = new Set(['', 'Oran Berry', 'Focus Sash', 'Choice Band']);

// ---------- state ----------
type Mon = { hp: number; st: '' | 'par' | 'brn'; item: boolean; pp: number[] };
type Side = { a: number; mons: Mon[]; b: number[] };
type S = { p: Side; c: Side; trap: number[]; charging: boolean; lock: number; replace: boolean };
type Template = { mon: Pokemon; moves: string[]; info: MoveInfo[]; max: number; item: string; ability: string };
// ablate: COUNTERFACTUAL switches used only to diagnose which mechanic drives a result; never the game.
type Fixture = { name: string; player: Template[]; cpu: Template[]; lead: number; notes: string[]; ablate?: Set<string> };

const cloneSide = (x: Side): Side => ({ a: x.a, b: x.b.slice(), mons: x.mons.map(m => ({ ...m, pp: m.pp.slice() })) });
const cloneS = (s: S): S => ({ ...s, p: cloneSide(s.p), c: cloneSide(s.c), trap: s.trap.slice() });
const keyOf = (s: S) => JSON.stringify([s.p, s.c, s.trap, s.charging, s.lock, s.replace]);
const freshBoosts = () => [0, 0, 0, 0, 0, 0, 0];

function template(mon: Pokemon): Template {
  const moves = mon.moves.filter(Boolean) as string[];
  for (const m of moves) if (!MOVES[m]) throw Error(`Unmodelled move ${m}`);
  const item = (mon.item as string) || '';
  if (!MODELLED_ITEMS.has(item)) throw Error(`Unmodelled item ${item}`);
  if (!MODELLED_ABILITIES.has(mon.ability as string)) throw Error(`Unmodelled ability ${mon.ability}`);
  return { mon, moves, info: moves.map(m => MOVES[m]), max: mon.maxHP(), item, ability: mon.ability as string };
}
const initialSide = (ts: Template[], lead: number): Side =>
  ({ a: lead, b: freshBoosts(), mons: ts.map(t => ({ hp: t.max, st: '', item: !!t.item, pp: t.info.map(i => i.pp) })) });

// ---------- calculator adapter (memoised) ----------
let calcCalls = 0;
// Cache keys use template identity: species+level collide (Darian has two L12 Magikarp with different nature/IVs/items).
const templateIds = new WeakMap<Template, number>();
let nextTemplateId = 0;
const tid = (t: Template) => { let i = templateIds.get(t); if (i === undefined) templateIds.set(t, i = nextTemplateId++); return i; };
const dmgCache = new Map<string, number[]>();
const speedCache = new Map<string, number>();
const field = new Field();
function battleMon(t: Template, m: Mon, b: number[]): Pokemon {
  const p = t.mon.clone();
  p.originalCurHP = m.hp;
  p.boosts = { hp: 0, atk: b[0], def: b[1], spa: b[2], spd: b[3], spe: b[4] } as any;
  p.status = m.st as any;
  p.item = (t.item === 'Choice Band' || m.item ? t.item || undefined : undefined) as any;
  return p;
}
function rolls(at: Template, am: Mon, ab: number[], dt: Template, dm: Mon, db: number[], move: string, crit: boolean): number[] {
  const lowHp = move === 'Flail' ? am.hp : +(am.hp <= at.max / 3);
  const key = [tid(at), tid(dt), move, crit, lowHp, am.st, ab, db, am.item, dm.item].join('|');
  let r = dmgCache.get(key);
  if (!r) {
    calcCalls++;
    const a = battleMon(at, am, ab), d = battleMon(dt, dm, db);
    const mv = new Move(gen, move, { ability: a.ability, item: a.item, species: a.species.name, isCrit: crit, hits: 1 } as any);
    const dmg = calculate(gen, a, d, mv, field).damage as any;
    r = typeof dmg === 'number' ? Array(16).fill(dmg) : dmg;
    if (!Array.isArray(r) || r.length !== 16 || r.some(x => typeof x !== 'number')) throw Error(`Unexpected damage shape for ${move}`);
    dmgCache.set(key, r!);
  }
  return r!;
}
function speed(t: Template, m: Mon, b: number[]): number {
  const key = [tid(t), m.st, b[4]].join('|');
  let v = speedCache.get(key);
  if (v === undefined) { v = getFinalSpeed(gen, battleMon(t, m, b), field, field.attackerSide); speedCache.set(key, v); }
  return v;
}

// ---------- turn kernel ----------
type World = { s: S; p: Frac; flinch: [boolean, boolean]; moved: [boolean, boolean]; cpuFainted: boolean; end?: 'fail' | 'win' | 'unsupported'; why?: string };
type Outcome = { kind: 'state' | 'fail' | 'win' | 'unsupported'; s?: S; p: Frac; why?: string };
export type Action = { kind: 'move'; i: number } | { kind: 'switch'; to: number };

const typeCache = new Map<string, string>();
const moveType = (m: string) => { let t = typeCache.get(m); if (!t) typeCache.set(m, t = new Move(gen, m).type); return t; };
function stageMult(stage: number): Frac { const s = Math.max(-6, Math.min(6, stage)); return s >= 0 ? fr(3 + s, 3) : fr(3, 3 - s); }
const sideOf = (s: S, who: 0 | 1) => (who === 0 ? s.p : s.c);

function makeKernel(fx: Fixture) {
  const T = [fx.player, fx.cpu];
  const ab = fx.ablate || new Set<string>();
  const tOf = (s: S, who: 0 | 1) => T[who][sideOf(s, who).a];
  const mOf = (s: S, who: 0 | 1) => sideOf(s, who).mons[sideOf(s, who).a];

  // Merge in-turn worlds that are identical in every respect except probability.
  function merge(ws: World[]): World[] {
    const m = new Map<string, World>();
    for (const w of ws) {
      const { s, p, ...rest } = w as any;
      const k = keyOf(s) + JSON.stringify(rest, Object.keys(rest).sort());
      const e = m.get(k);
      if (e) e.p = add(e.p, p); else m.set(k, w);
    }
    return [...m.values()];
  }
  function branch(ws: World[], f: (w: World) => Array<[Frac, (w: World) => void]>): World[] {
    const out: World[] = [];
    for (const w of ws) {
      if (w.end) { out.push(w); continue; }
      const opts = f(w).filter(([p]) => !isZero(p));
      if (opts.length === 1) { opts[0][1](w); out.push(w); continue; }
      for (const [p, fn] of opts) {
        const n: World = { ...w, s: cloneS(w.s), p: mul(w.p, p), flinch: [...w.flinch] as any, moved: [...w.moved] as any };
        fn(n); out.push(n);
      }
    }
    return out;
  }
  // Applies damage, Sturdy/Focus Sash, Oran Berry; marks player faint as failure.
  function hurt(w: World, who: 0 | 1, dmg: number, fromAttack: boolean) {
    const t = tOf(w.s, who), m = mOf(w.s, who);
    if (dmg >= m.hp && fromAttack && m.hp === t.max) {
      if (t.ability === 'Sturdy') dmg = m.hp - 1;
      else if (t.item === 'Focus Sash' && m.item) { dmg = m.hp - 1; m.item = false; }
    }
    m.hp = Math.max(0, m.hp - dmg);
    if (m.hp === 0) {
      if (who === 0) { w.end = 'fail'; w.why = `${t.mon.name} fainted`; }
      else { w.cpuFainted = true; if (w.s.c.mons.every(x => x.hp === 0)) w.end = 'win'; }
      return;
    }
    if (t.item === 'Oran Berry' && m.item && m.hp <= t.max / 2) { m.hp = Math.min(t.max, m.hp + 10); m.item = false; }
  }

  function useMove(ws: World[], who: 0 | 1, mi: number): World[] {
    const opp = (1 - who) as 0 | 1;
    ws = ws.map(w => w); // world list for this actor
    // Pre-move gates: fainted, flinch, full paralysis.
    ws = branch(ws, w => {
      if (mOf(w.s, who).hp === 0 || (who === 1 && w.cpuFainted)) return [[ONE, x => { x.moved[who] = true; (x as any).skip = true; }]];
      if (w.flinch[who]) return [[ONE, x => { x.moved[who] = true; (x as any).skip = true; }]];
      if (mOf(w.s, who).st === 'par') return [[fr(1, 4), x => { x.moved[who] = true; (x as any).skip = true; if (who === 1) x.s.charging = false; }], [fr(3, 4), () => {}]];
      return [[ONE, () => {}]];
    });
    const done: World[] = [], go: World[] = [];
    for (const w of ws) ((w as any).skip || w.end ? done : go).push(w), delete (w as any).skip;
    let cur = go;
    const name = (w: World) => (mi < 0 ? 'Struggle' : tOf(w.s, who).moves[mi]);
    const info = (w: World) => (mi < 0 ? STRUGGLE : tOf(w.s, who).info[mi]);
    // PP, Bounce charge, Choice lock.
    const charged: World[] = [];
    cur = cur.filter(w => {
      const inf = info(w), m = mOf(w.s, who);
      if (who === 1 && inf.bounce && w.s.charging) { w.s.charging = false; return true; }
      if (mi < 0) return true;
      m.pp[mi]--;
      if (who === 1 && tOf(w.s, 1).item === 'Choice Band') w.s.lock = mi;
      if (who === 1 && inf.bounce) { w.s.charging = true; w.moved[who] = true; charged.push(w); return false; }
      return true;
    });
    // Semi-invulnerable target and self-targeting status.
    const after: World[] = [];
    cur = cur.filter(w => {
      const inf = info(w);
      if (inf.self) { const b = sideOf(w.s, who).b; b[inf.self[0]] = Math.min(6, b[inf.self[0]] + inf.self[1]); after.push(w); return false; }
      if (who === 0 && w.s.charging) { after.push(w); return false; }
      return true;
    });
    // Accuracy.
    cur = branch(cur, w => {
      const inf = info(w);
      if (inf.acc === true || ab.has('accuracy')) return [[ONE, () => {}]];
      const stage = sideOf(w.s, who).b[5] - sideOf(w.s, opp).b[6];
      let hit = mul(fr(inf.acc, 100), stageMult(stage));
      if (hit[0] >= hit[1]) hit = ONE;
      return [[hit, () => {}], [add(ONE, [-hit[0], hit[1]]), x => { (x as any).miss = true; }]];
    });
    for (const w of cur) if ((w as any).miss) { delete (w as any).miss; after.push(w); }
    cur = cur.filter(w => !after.includes(w));
    // Status moves aimed at the opponent.
    cur = cur.filter(w => {
      const inf = info(w);
      if (!inf.target) return true;
      const keenEye = tOf(w.s, opp).ability === 'Keen Eye' && inf.target[0] === 5;
      const b = sideOf(w.s, opp).b;
      if (!keenEye) b[inf.target[0]] = Math.max(-6, b[inf.target[0]] + inf.target[1]);
      after.push(w); return false;
    });
    // Damaging moves: hit-count distribution, then per-hit crit and roll (aggregating equal damage).
    cur = branch(cur, w => info(w).multi
      ? [[fr(35, 100), x => { (x as any).hits = 2; }], [fr(35, 100), x => { (x as any).hits = 3; }],
         [fr(15, 100), x => { (x as any).hits = 4; }], [fr(15, 100), x => { (x as any).hits = 5; }]]
      : [[ONE, x => { (x as any).hits = 1; }]]);
    for (let h = 0; h < 5; h++) {
      cur = branch(cur, w => {
        if (w.end || (w as any).hits <= h || mOf(w.s, opp).hp === 0) return [[ONE, () => {}]];
        const at = tOf(w.s, who), dt = tOf(w.s, opp);
        const critP = ab.has('crit') || dt.ability === 'Shell Armor' || dt.ability === 'Battle Armor' ? fr(0, 1) : fr(1, 24);
        const res: Array<[Frac, (w: World) => void]> = [];
        for (const crit of [false, true]) {
          const pc = crit ? critP : add(ONE, [-critP[0], critP[1]]);
          if (isZero(pc)) continue;
          const r = rolls(at, mOf(w.s, who), sideOf(w.s, who).b, dt, mOf(w.s, opp), sideOf(w.s, opp).b, name(w), crit);
          const counts = new Map<number, number>();
          for (const d of r) counts.set(d, (counts.get(d) || 0) + 1);
          for (const [d, c] of counts) res.push([mul(pc, fr(c, 16)), x => {
            const before = mOf(x.s, opp).hp;
            hurt(x, opp, d, true);
            const dealt = before - mOf(x.s, opp).hp;
            (x as any).dealt = ((x as any).dealt || 0) + dealt;
            if (info(x).drain && dealt > 0 && !x.end) {
              const m = mOf(x.s, who); m.hp = Math.min(tOf(x.s, who).max, m.hp + Math.max(1, Math.round(dealt / 2)));
            }
            if (d > 0 && dt.ability === 'Cotton Down') { const b = sideOf(x.s, who).b; b[4] = Math.max(-6, b[4] - 1); }
            const mt = moveType(name(x));
            if (d > 0 && dt.ability === 'Rattled' && ['Bug', 'Dark', 'Ghost'].includes(mt)) { const b = sideOf(x.s, opp).b; b[4] = Math.min(6, b[4] + 1); }
          }]);
        }
        return res;
      });
      cur = merge(cur);
    }
    // Secondary effects on a surviving target that took damage.
    cur = branch(cur, w => {
      const inf = info(w), dt = tOf(w.s, opp), dm = mOf(w.s, opp);
      const dealt = (w as any).dealt || 0; delete (w as any).dealt; delete (w as any).hits;
      if (w.end || dm.hp === 0 || dealt === 0) return [[ONE, () => {}]];
      if (inf.bugBite && dm.item && dt.item === 'Oran Berry') return [[ONE, x => { x.end = 'unsupported'; x.why = 'Bug Bite berry theft'; }]];
      const opts: Array<[Frac, (w: World) => void]> = [];
      const chance = (pct: number, fn: (x: World) => void) => { opts.push([fr(pct, 100), fn], [fr(100 - pct, 100), () => {}]); };
      if (inf.par && !ab.has('paralysis') && !dm.st && !dt.mon.hasType('Electric')) chance(inf.par, x => { mOf(x.s, opp).st = 'par'; });
      else if (inf.brn && !ab.has('burn') && !dm.st && !dt.mon.hasType('Fire')) chance(inf.brn, x => { mOf(x.s, opp).st = 'brn'; });
      else if (inf.flinch && !w.moved[opp]) chance(inf.flinch, x => { x.flinch[opp] = true; });
      else if (inf.speDrop) chance(inf.speDrop, x => { const b = sideOf(x.s, opp).b; b[4] = Math.max(-6, b[4] - 1); });
      else if (inf.wrap && who === 1 && !w.s.trap.length) opts.push([ONE, x => { x.s.trap = [4, 5]; }]);
      return opts.length ? opts : [[ONE, () => {}]];
    });
    for (const w of cur) if (!w.end && mi < 0 && mOf(w.s, who).hp > 0) hurt(w, who, Math.max(1, Math.round(tOf(w.s, who).max / 4)), false);
    for (const w of [...cur, ...after]) w.moved[who] = true;
    return [...done, ...charged, ...after, ...cur];
  }

  function endOfTurn(ws: World[]): World[] {
    // Conservative order: player residuals first, so a player faint is never excused by a same-turn win.
    ws = branch(ws, w => {
      const m = mOf(w.s, 0), t = tOf(w.s, 0);
      if (m.st === 'brn') hurt(w, 0, Math.max(1, Math.floor(t.max / 16)), false);
      if (w.end || !w.s.trap.length) return [[ONE, () => {}]];
      if (w.cpuFainted) { w.s.trap = []; return [[ONE, () => {}]]; }
      hurt(w, 0, Math.max(1, Math.floor(t.max / 8)), false);
      if (w.end) return [[ONE, () => {}]];
      const left = w.s.trap.map(x => x - 1);
      const freed = left.filter(x => x === 0).length, still = left.filter(x => x > 0);
      // Remaining Wrap turns are hidden; the state carries the observable belief set.
      return [[fr(freed, left.length), x => { x.s.trap = []; }], [fr(still.length, left.length), x => { x.s.trap = still; }]];
    });
    for (const w of ws) {
      if (w.end || w.cpuFainted) continue;
      const m = mOf(w.s, 1), t = tOf(w.s, 1);
      if (m.st === 'brn') hurt(w, 1, Math.max(1, Math.floor(t.max / 16)), false);
    }
    return ws;
  }

  function cpuChoices(s: S): number[] {
    const m = mOf(s, 1), info = tOf(s, 1).info;
    if (s.charging) return [info.findIndex(i => i.bounce)];
    if (s.lock >= 0) return m.pp[s.lock] > 0 ? [s.lock] : [];
    return info.map((_, i) => i).filter(i => m.pp[i] > 0);
  }
  function playerActions(s: S): Action[] {
    const m = mOf(s, 0);
    const acts: Action[] = tOf(s, 0).info.map((_, i) => ({ kind: 'move', i } as Action)).filter(a => m.pp[(a as any).i] > 0);
    if (!acts.length) acts.push({ kind: 'move', i: -1 });
    if (!s.trap.length) s.p.mons.forEach((x, i) => { if (i !== s.p.a && x.hp > 0) acts.push({ kind: 'switch', to: i }); });
    return acts;
  }

  // All outcomes of one turn for a fixed player action, over every CPU choice (AI-agnostic) and chance.
  function turn(s0: S, act: Action): { outcomes: Outcome[]; massChecks: number } {
    if (s0.replace) throw Error('turn() on replacement node');
    const all: Outcome[] = [];
    let massChecks = 0;
    const choices: number[] = cpuChoices(s0);
    if (!choices.length) choices.push(-1);
    for (const ci of choices) {
      const s = cloneS(s0);
      if (act.kind === 'switch') { s.p.a = act.to; s.p.b = freshBoosts(); }
      let ws: World[] = [{ s, p: ONE, flinch: [false, false], moved: [false, false], cpuFainted: false }];
      const pInfo = act.kind === 'move' ? (act.i < 0 ? STRUGGLE : tOf(s, 0).info[act.i]) : undefined, cInfo = ci < 0 ? STRUGGLE : tOf(s, 1).info[ci];
      const pPrio = pInfo?.prio || 0, cPrio = s0.charging ? 0 : cInfo.prio || 0;
      ws = branch(ws, w => {
        if (!pInfo) return [[ONE, x => { (x as any).order = [1]; }]];
        const ps = speed(tOf(w.s, 0), mOf(w.s, 0), w.s.p.b), cs = speed(tOf(w.s, 1), mOf(w.s, 1), w.s.c.b);
        const first = pPrio !== cPrio ? (pPrio > cPrio ? 0 : 1) : ps !== cs ? (ps > cs ? 0 : 1) : -1;
        if (first >= 0) return [[ONE, x => { (x as any).order = first === 0 ? [0, 1] : [1, 0]; }]];
        return [[fr(1, 2), x => { (x as any).order = [0, 1]; }], [fr(1, 2), x => { (x as any).order = [1, 0]; }]];
      });
      for (const step of [0, 1]) {
        const groups = new Map<number, World[]>();
        for (const w of ws) { const who = (w as any).order[step]; if (who === undefined) { groups.set(-1, [...(groups.get(-1) || []), w]); continue; } groups.set(who, [...(groups.get(who) || []), w]); }
        ws = [];
        for (const [who, g] of groups) ws.push(...(who === -1 ? g : useMove(g, who as 0 | 1, who === 0 ? (act as any).i : ci)));
      }
      ws = endOfTurn(ws);
      let mass: Frac = [0n, 1n];
      for (const w of ws) {
        mass = add(mass, w.p);
        if (w.end) { all.push({ kind: w.end, p: w.p, why: w.why }); continue; }
        const s = w.s;
        if (w.cpuFainted) { s.replace = true; s.charging = false; s.lock = -1; s.trap = []; s.c.b = freshBoosts(); }
        all.push({ kind: 'state', s, p: w.p });
      }
      if (mass[0] !== mass[1]) throw Error(`Probability mass ${mass} != 1`);
      massChecks++;
    }
    // Aggregate identical successors (probabilities are summed only for display; zero-tolerance uses support).
    const agg = new Map<string, Outcome>();
    for (const o of all) {
      const k = o.kind === 'state' ? keyOf(o.s!) : `${o.kind}:${o.why || ''}`;
      const e = agg.get(k);
      if (e) e.p = add(e.p, o.p); else agg.set(k, o);
    }
    return { outcomes: [...agg.values()], massChecks };
  }
  function replacements(s: S): S[] {
    return s.c.mons.map((m, i) => [m, i] as const).filter(([m]) => m.hp > 0).map(([, i]) => {
      const n = cloneS(s); n.c.a = i; n.replace = false; return n;
    });
  }
  return { turn, replacements, playerActions, tOf, mOf };
}

// ---------- search ----------
type Ordering = 'listed' | 'progress-first';
function search(fx: Fixture, ordering: Ordering, budgetMs: number) {
  const K = makeKernel(fx);
  const win = new Map<string, Action | 'replace'>(), fail = new Set<string>(), onStack = new Set<string>();
  let expansions = 0, turnEvals = 0, massChecks = 0, unsupportedSeen = new Map<string, number>(), aborted = false;
  const t0 = performance.now(); calcCalls = 0; dmgCache.clear(); speedCache.clear();

  function order(s: S): Action[] {
    const acts = K.playerActions(s);
    if (ordering === 'listed') return acts;
    const score = (a: Action) => {
      if (a.kind === 'switch') return -2;
      if (a.i < 0) return 0;
      const t = K.tOf(s, 0), info = t.info[a.i];
      if (info.status) return -1;
      const r = rolls(t, K.mOf(s, 0), s.p.b, K.tOf(s, 1), K.mOf(s, 1), s.c.b, t.moves[a.i], false);
      return Math.min(...r) / Math.max(1, K.mOf(s, 1).hp) + (info.prio ? 0.01 : 0);
    };
    return acts.map(a => [a, score(a)] as const).sort((x, y) => y[1] - x[1]).map(([a]) => a);
  }
  const cachedTurn = (s: S, k: string, a: Action) => {
    // No turn-result cache: solved/refuted state memo already prevents re-expansion, and cached successors exhausted heap.
    const r = K.turn(s, a); massChecks += r.massChecks; turnEvals++;
    return r.outcomes;
  };
  // Returns [solved, taintedByCycle].
  function solve(s: S): [boolean, boolean] {
    const k = keyOf(s);
    if (win.has(k)) return [true, false];
    if (fail.has(k)) return [false, false];
    if (onStack.has(k)) return [false, true];
    if ((++expansions & 255) === 0 && performance.now() - t0 > budgetMs) aborted = true;
    if (aborted) return [false, true];
    onStack.add(k);
    let tainted = false;
    if (s.replace) {
      let ok = true;
      for (const n of K.replacements(s)) { const [r, t] = solve(n); tainted ||= t; if (!r) { ok = false; break; } }
      onStack.delete(k);
      if (ok) { win.set(k, 'replace'); return [true, false]; }
      if (!tainted) fail.add(k);
      return [false, tainted];
    }
    for (const a of order(s)) {
      const outs = cachedTurn(s, k, a);
      const bad = outs.find(o => o.kind === 'fail' || o.kind === 'unsupported');
      if (bad) { if (bad.kind === 'unsupported') unsupportedSeen.set(bad.why!, (unsupportedSeen.get(bad.why!) || 0) + 1); continue; }
      // Counterexample-first: most threatened successors first.
      const next = outs.filter(o => o.kind === 'state').sort((x, y) => K.mOf(x.s!, 0).hp - K.mOf(y.s!, 0).hp);
      let ok = true;
      for (const o of next) { const [r, t] = solve(o.s!); tainted ||= t; if (!r) { ok = false; break; } }
      if (ok) { onStack.delete(k); win.set(k, a); return [true, false]; }
    }
    onStack.delete(k);
    if (!tainted) fail.add(k);
    return [false, tainted];
  }
  const root: S = { p: initialSide(fx.player, fx.lead), c: initialSide(fx.cpu, 0), trap: [], charging: false, lock: -1, replace: false };
  const heapBefore = process.memoryUsage().heapUsed;
  const [ok] = solve(root);
  const ms = performance.now() - t0;
  const heapAfter = process.memoryUsage().heapUsed;
  return { K, root, ok, aborted, ms, win, fail, solve, stats: { expansions, turnEvals, massChecks, calcCalls, damageCacheEntries: dmgCache.size,
    solvedStates: win.size, refutedStates: fail.size, 
    heapDeltaBytesSharedProcess: heapAfter - heapBefore, unsupportedRejections: Object.fromEntries(unsupportedSeen) } };
}

// ---------- independent policy audit (fresh kernel caches, no search memo) ----------
function audit(fx: Fixture, root: S, policy: Map<string, Action | 'replace'>) {
  const K = makeKernel(fx);
  dmgCache.clear(); speedCache.clear();
  const t0 = performance.now();
  const ok = new Set<string>(), path = new Set<string>();
  let decisionStates = 0, maxTurns = 0, outcomeEdges = 0;
  // Exact probability of each turn count under a uniformly random CPU choice is NOT computed: CPU is adversarial.
  function check(s: S, depth: number): string | null {
    const k = keyOf(s);
    if (ok.has(k)) return null;
    if (path.has(k)) return 'cycle in policy';
    path.add(k);
    let err: string | null = null;
    if (s.replace) {
      for (const n of K.replacements(s)) if ((err = check(n, depth))) break;
    } else {
      const a = policy.get(k);
      if (!a || a === 'replace') err = 'policy missing a reachable decision';
      else {
        decisionStates++; maxTurns = Math.max(maxTurns, depth + 1);
        for (const o of K.turn(s, a).outcomes) {
          outcomeEdges++;
          if (o.kind === 'fail' || o.kind === 'unsupported') { err = `${o.kind}: ${o.why}`; break; }
          if (o.kind === 'state' && (err = check(o.s!, depth + 1))) break;
        }
      }
    }
    path.delete(k);
    if (!err) ok.add(k);
    return err;
  }
  const err = check(root, 0);
  return { passed: !err, error: err, decisionStates, maxTurns, outcomeEdges, ms: performance.now() - t0 };
}

function describeAction(K: ReturnType<typeof makeKernel>, s: S, a: Action | 'replace' | undefined) {
  if (!a || a === 'replace') return String(a);
  return a.kind === 'move' ? (a.i < 0 ? 'Struggle' : K.tOf(s, 0).moves[a.i]) : `switch to ${K.tOf({ ...s, p: { ...s.p, a: a.to } }, 0).mon.name}`;
}
// Readable first decisions of the policy: root action and the response to each CPU lead/replacement.
function summarise(fx: Fixture, root: S, policy: Map<string, Action | 'replace'>, depth = 3) {
  const K = makeKernel(fx);
  const lines = new Map<string, number>();
  function walk(s: S, d: number, prefix: string[]) {
    if (d === depth) { lines.set(prefix.join(' → '), (lines.get(prefix.join(' → ')) || 0) + 1); return; }
    if (s.replace) { for (const n of K.replacements(s)) walk(n, d, [...prefix, `[CPU sends ${K.tOf(n, 1).mon.name}]`]); return; }
    const a = policy.get(keyOf(s));
    const label = `${K.tOf(s, 0).mon.name}: ${describeAction(K, s, a)}`;
    const outs = K.turn(s, a as Action).outcomes;
    const states = outs.filter(o => o.kind === 'state');
    if (!states.length) { lines.set([...prefix, label, '(win)'].join(' → '), (lines.get([...prefix, label, '(win)'].join(' → ')) || 0) + 1); return; }
    for (const o of states) walk(o.s!, d + 1, [...prefix, label]);
  }
  walk(root, 0, []);
  return [...lines.entries()].map(([l, n]) => `${l}   (${n} distinct outcome states)`);
}

// Shallow refutation witness: why each action fails at a state (used for diagnostics only).
function explain(fx: Fixture, r: ReturnType<typeof search>, s: S, depth: number, indent = ''): string[] {
  const K = r.K, out: string[] = [];
  const show = (x: S) => `P ${x.p.mons.map((m, i) => `${K.tOf({ ...x, p: { ...x.p, a: i } }, 0).mon.name}${i === x.p.a ? '*' : ''}:${m.hp}${m.st ? '/' + m.st : ''}${m.item ? '' : '(no item)'}`).join(' ')}` +
    ` | C ${x.c.mons.map((m, i) => `${K.tOf({ ...x, c: { ...x.c, a: i } }, 1).mon.name}${i === x.c.a ? '*' : ''}:${m.hp}${m.st ? '/' + m.st : ''}`).join(' ')}` +
    `${x.charging ? ' [CPU airborne]' : ''}${x.trap.length ? ` [trapped ${x.trap}]` : ''} pBoost ${x.p.b} cBoost ${x.c.b}`;
  if (s.replace) {
    for (const n of K.replacements(s)) if (!r.solve(n)[0]) { out.push(`${indent}CPU sends ${K.tOf(n, 1).mon.name}: ${show(n)}`); if (depth > 0) out.push(...explain(fx, r, n, depth, indent)); return out; }
    return out;
  }
  for (const a of K.playerActions(s)) {
    const outs = K.turn(s, a).outcomes;
    const bad = outs.filter(o => o.kind === 'fail' || o.kind === 'unsupported');
    const label = `${indent}${describeAction(K, s, a)}`;
    if (bad.length) {
      const mass = bad.reduce((m, o) => add(m, o.p), [0n, 1n] as Frac);
      out.push(`${label}: immediate ${bad.map(o => o.why).filter((v, i, x) => x.indexOf(v) === i).join(', ')} (summed over CPU choices ${mass[0]}/${mass[1]})`);
      continue;
    }
    const child = outs.find(o => o.kind === 'state' && !r.solve(o.s!)[0]);
    if (!child) { out.push(`${label}: solved`); continue; }
    out.push(`${label}: refuted via ${show(child.s!)}`);
    if (depth > 0) out.push(...explain(fx, r, child.s!, depth - 1, indent + '    '));
  }
  return out;
}

// ---------- fixtures ----------
function mayFixture(): Fixture {
  const [Torchic, Turtwig] = importTeam(`
Torchic
Level: 5
Bashful Nature
Ability: Blaze
- Ember
- Scratch
- Growl

Turtwig
Level: 12
Hardy Nature
Ability: Shell Armor
IVs: 20 HP / 27 Atk / 8 SpA
- Absorb
- Bite
- Confide
- Growl
`);
  return { name: 'Route 103 Rival May (1v1 adapter check)', player: [template(Turtwig)], cpu: [template(Torchic)], lead: 0,
    notes: ['Setup copied from playthrough.spec.ts; level 12 vs level 5 is the test setup, not representative.'] };
}
function rickFixture(names: string[], lead: string): Fixture {
  const box = getBox() as Record<string, Pokemon>;
  const team = names.map(n => template(box[n]));
  return { name: `Bug Catcher Rick — ${names.join('/')} (lead ${lead}, no items)`, player: team,
    cpu: (OpposingTrainer('Bug Catcher Rick') as Pokemon[]).map(template), lead: names.indexOf(lead),
    notes: ['Player box from museum.collection.ts; no held items, as in playthrough.spec.ts.'] };
}
function darianFixture(names: string[], lead: string): Fixture {
  const box = getBox() as Record<string, Pokemon>;
  const team = names.map(n => { const p = box[n]; p.item = 'Oran Berry' as any; return template(p); });
  return { name: `Fisherman Darian — ${names.join('/')} (lead ${lead}, all Oran Berry)`, player: team,
    cpu: (OpposingTrainer('Fisherman Darian') as Pokemon[]).map(template), lead: names.indexOf(lead),
    notes: ['Player box from museum.collection.ts with Oran Berries, as in playthrough.spec.ts.'] };
}

const MODEL = {
  modelled: [
    'Damage: patched @smogon/calc gen-8 formula, all 16 rolls each 1/16, equal damage values aggregated.',
    'Critical hits 1/24 (stage 0), damage via calc isCrit; none against Shell Armor/Battle Armor.',
    'Accuracy from a hand-entered gen-8 move table with accuracy/evasion stages; Keen Eye blocks accuracy drops.',
    'Move order: priority, then calc final speed (stages, paralysis); exact ties split 1/2.',
    'Multi-hit (Pin Missile): 2/3/4/5 hits at 35/35/15/15%, independent roll and crit per hit; Sturdy only on first hit.',
    'Sturdy and Focus Sash at full HP; Oran Berry heals 10 at <=50% immediately after damage (between multi-hits).',
    'Paralysis (30% Spark/Bounce; Electric immune; 25% full paralysis, no PP used), burn (10% Ember; Fire immune; 1/16 end of turn; attack halving via calc).',
    'Flinch (30% Bite, only if the user moved first), Bubble Beam 10% Speed drop, stat-stage status moves (Growl, Confide, Sand Attack, Baby-Doll Eyes, Iron Defense).',
    'Absorb drains round(dealt/2), min 1. Cotton Down lowers attacker Speed per damaging hit; Rattled raises Speed on Bug/Dark/Ghost hits.',
    'Wrap: traps for 4 or 5 end-of-turn 1/8 damage ticks; the remaining count is hidden, so the state stores the observable belief set; ends if the trapper faints. Trapped player cannot switch.',
    'Bounce: charge turn (PP used), semi-invulnerable to all player moves, strikes next turn. Choice Band locks the first move used.',
    'PP tracked exactly (no PP used on full paralysis/flinch). Struggle when no move has PP: 50 BP typeless via calc, never misses, recoil round(max/4). Bug Bite against a held berry is UNSUPPORTED.',
    'CPU move choice and CPU replacement after a faint are adversarial over every legal option (AI-agnostic superset of the AI document).',
    'Player: every move with PP and every voluntary switch to a healthy bench Pokemon each turn. Set mode: no free switch after a KO.',
    'End of turn: player residuals before CPU residuals (conservative: a player faint is never excused by a same-turn win).',
  ],
  notModelledOrAssumed: [
    'Exact Run & Bun ROM behaviour: crit rate, multi-hit distribution, Wrap duration, PP-on-full-paralysis, drain rounding, residual order and Set mode are gen-8 assumptions pending the mechanics-validation ticket.',
    'CPU AI probabilities are not used; zero-tolerance qualification needs only the support of CPU behaviour, so an adversarial CPU is a sound superset. Positive-tolerance risk is not computed.',
    'Player observes exact CPU HP (HP bar has >= 48 pixels, more than these opponents\' max HP). Other hidden state: only Wrap duration, handled by belief sets.',
    'Moves, items and abilities outside the tables above throw at fixture construction, or become UNSUPPORTED outcomes during search.',
    'No positive-tolerance synthesis, doubles, held-item allocation, interruption/resume or Android measurement in this run.',
  ],
};

// ---------- run ----------
// Diagnostic: Darian's first Magikarp only (Choice Band, Bounce is its only move), so CPU behaviour is forced
// and any refutation comes from chance alone, not from the adversarial CPU superset.
test('Darian first Magikarp only: forced CPU behaviour', () => {
  const out: any[] = [];
  for (const abl of [[], ['paralysis']]) {
    const fx = darianFixture(['Starly', 'Gossifleur', 'Poochyena', 'Turtwig', 'Surskit'], 'Starly');
    fx.cpu = fx.cpu.slice(0, 1); fx.ablate = new Set(abl);
    fx.name = `Darian first Magikarp only${abl.length ? ' — COUNTERFACTUAL without ' + abl.join(', ') : ''}`;
    const r = search(fx, 'progress-first', +(process.env.PROTOTYPE_BUDGET_MS || 300000));
    const run: any = { fixture: fx.name, counterfactual: abl, result: r.ok ? 'qualified' : r.aborted ? 'unresolved: budget exhausted' : 'refuted', ms: +r.ms.toFixed(1), ...r.stats };
    if (r.ok) { run.audit = audit(fx, r.root, r.win); run.policyOpening = summarise(fx, r.root, r.win, 3); }
    else if (!r.aborted) run.refutationWitness = explain(fx, r, r.root, 2);
    out.push(run);
  }
  writeFileSync(`${__dirname}/real-encounter-search-129.darian-first-magikarp.json`, JSON.stringify(out, null, 1) + '\n');
  console.log(JSON.stringify(out, null, 1));
}, 3_600_000);

test('real-encounter exact search (prototype #129)', () => {
  const budget = +(process.env.PROTOTYPE_BUDGET_MS || 300000);
  const cases: Array<() => Fixture> = [
    mayFixture,
    () => rickFixture(['Turtwig', 'Gossifleur', 'Poochyena', 'Starly', 'Surskit'], 'Turtwig'),
    () => darianFixture(['Starly', 'Gossifleur', 'Poochyena', 'Turtwig', 'Surskit'], 'Starly'),
  ];
  const report: any = {
    warning: 'THROWAWAY prototype. Desktop timings are not phone evidence. Guarantees are conditional on the listed mechanics model.',
    command: 'npx jest --runInBand --runTestsByPath src/extensions/simulator/prototypes/real-encounter-search-129.spec.ts',
    baseRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    device: { platform: platform(), release: release(), arch: arch(), cpu: cpus()[0]?.model, logicalCPUs: cpus().length,
      hostMemoryBytes: totalmem(), runtime: process.version, conditions: 'Shared Linux host under Jest/ts-jest; not Android' },
    activeBudgetMsPerCase: budget, model: MODEL, runs: [] as any[],
  };
  for (const make of cases) {
    for (const ordering of ['listed', 'progress-first'] as Ordering[]) {
      const fx = make();
      const r = search(fx, ordering, budget);
      const run: any = { fixture: fx.name, notes: fx.notes, ordering,
        result: r.ok ? 'qualified: sure victory, zero faint (in model)' : r.aborted ? 'unresolved: budget exhausted (not a defeat)' : 'no zero-faint sure-victory policy exists in model',
        ms: +r.ms.toFixed(1), ...r.stats };
      if (r.ok) {
        run.audit = audit(fx, r.root, r.win);
        run.policyOpening = summarise(fx, r.root, r.win, 2);
      }
      if (!r.ok && !r.aborted && ordering === 'listed') run.refutationWitness = explain(fx, r, r.root, +(process.env.PROTOTYPE_EXPLAIN_DEPTH || 1));
      report.runs.push(run);
      console.log(JSON.stringify(run, null, 1));
    }
  }
  // COUNTERFACTUAL ablations: identify which modelled mechanics make zero-faint sure victory impossible.
  const ablations = [['paralysis'], ['paralysis', 'crit'], ['paralysis', 'crit', 'accuracy']];
  for (const make of cases.slice(1)) for (const abl of ablations) {
    const fx = make(); fx.ablate = new Set(abl); fx.name += ` — COUNTERFACTUAL without ${abl.join(', ')}`;
    const r = search(fx, 'progress-first', budget);
    const run: any = { fixture: fx.name, ordering: 'progress-first', counterfactual: abl,
      result: r.ok ? 'qualified in counterfactual model' : r.aborted ? 'unresolved: budget exhausted' : 'no zero-faint sure-victory policy in counterfactual model',
      ms: +r.ms.toFixed(1), ...r.stats };
    if (r.ok) { run.audit = audit(fx, r.root, r.win); run.policyOpening = summarise(fx, r.root, r.win, 2); }
    report.runs.push(run);
    console.log(JSON.stringify(run, null, 1));
  }
  writeFileSync(`${__dirname}/real-encounter-search-129.measurements.json`, JSON.stringify(report, null, 1) + '\n');
}, 3_600_000);
