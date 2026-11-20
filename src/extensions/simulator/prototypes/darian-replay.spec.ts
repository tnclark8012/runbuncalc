import { calculate, Field, Pokemon } from '@smogon/calc';
import { attack, gen, Heuristics, PlannedPlayerActionProvider, PlannedTrainerAction, switchTo } from '../../configuration';
import { OpposingTrainer } from '../../trainer-sets';
import { createMove } from '../moveScoring';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../moveScoring.contracts';
import { runTurn, startTurn } from '../turn-state';
import * as turnState from '../turn-state';
import { getBox } from '../playthrough/museum.collection';
import { DecisionNode, findPlayerWinningPath } from '../path-finder';
import { performance } from 'node:perf_hooks';

function darianFixture() {
  const { Starly, Gossifleur, Poochyena, Turtwig, Surskit } = getBox();
  const team = [Starly, Gossifleur, Poochyena, Turtwig, Surskit];
  for (const mon of team) mon.item = 'Oran Berry' as typeof mon.item;
  const initial = new BattleFieldState(
    new PlayerTrainer([new PokemonPosition(Starly, true)], team.slice(1)),
    new CpuTrainer([], OpposingTrainer('Fisherman Darian')), new Field());
  return { initial, Starly, Gossifleur };
}

function withPlan<T>(line: PlannedTrainerAction[], run: () => T): T {
  const previous = Heuristics.playerActionProvider;
  Heuristics.playerActionProvider = new PlannedPlayerActionProvider(line.map(action => [action]));
  try { return run(); }
  finally {
    if (previous) Heuristics.playerActionProvider = previous;
    else delete Heuristics.playerActionProvider;
  }
}

// Throwaway diagnostic: the legacy simulator does not enumerate game RNG.
test('compare Darian switch timing and follow-up moves under configured simulator rolls', () => {
  const { initial, Starly, Gossifleur } = darianFixture();
  const prefix = [attack(Starly, 'Quick Attack'), attack(Starly, 'Aerial Ace'), attack(Starly, 'Quick Attack')];
  const suffix = [switchTo(Gossifleur), attack(Gossifleur, 'Leafage'), attack(Gossifleur, 'Leafage')];
  const magicalLeaf = attack(Gossifleur, 'Magical Leaf');
  const reports = [
    [...prefix, attack(Starly, 'Aerial Ace'), ...suffix],
    [...prefix, ...suffix],
    [...prefix, suffix[0], magicalLeaf, magicalLeaf],
    [...prefix, suffix[0], suffix[1], magicalLeaf],
  ].map((line, lineIndex) => withPlan(line, () => {
    let frontier = [{ state: initial, pathWeight: 1 }];
    const turns = [];
    for (const [i, action] of line.entries()) {
      if (!frontier.length) break;
      const next: typeof frontier = [];
      const outcomes = frontier.flatMap(({ state, pathWeight }) => {
        if (action.type === 'move' && state.player.active[0]?.pokemon.name !== action.pokemon.name)
          throw Error(`Planned attacker is not active on turn ${i + 1}`);
        const branches = runTurn(state);
        if (!branches.length) throw Error(`Replay produced no outcomes on turn ${i + 1}`);
        return branches.map(branch => ({ ...branch, pathWeight: pathWeight * branch.probability }));
      }).map(({ state, history, probability, pathWeight }) => {
        const player = [...state.player.active.map(p => p.pokemon), ...state.player.party];
        const cpu = [...state.cpu.active.map(p => p.pokemon), ...state.cpu.party];
        const result = player.some(p => p.curHP() <= 0) ? 'player faint'
          : cpu.every(p => p.curHP() <= 0) ? 'victory' : 'ongoing';
        if (result === 'ongoing') next.push({ state, pathWeight });
        return { configuredConditionalWeight: probability, configuredPathWeight: pathWeight,
          result, player: player.map(hp), cpu: cpu.map(hp),
          actions: history.map(entry => entry.description) };
      });
      turns.push({ turn: i + 1, action: action.type === 'move' ? action.move : `Switch to ${action.pokemon.name}`, outcomes });
      frontier = next;
      if (i === 2 && lineIndex === 1) {
        if (frontier.length !== 1) throw Error('Expected a single configured-roll prefix for the breakpoint probe');
        const before = frontier[0].state;
        const starts = startTurn(before);
        if (starts.length !== 1 || !starts[0].state.cpu.active[0]?.pokemon.hasItem('Focus Sash'))
          throw Error('Expected the second Magikarp at the breakpoint probe');
        const magikarp = starts[0].state.cpu.active[0].pokemon;
        const switchIn = before.player.party.find(p => p.name === Gossifleur.name);
        if (!switchIn) throw Error('Expected Gossifleur on the bench');
        console.log(JSON.stringify({
          probe: 'Conditional on the second Magikarp using Hydro Pump and hitting; calculator, noncritical',
          targets: [before.player.active[0].pokemon, switchIn].map(target => {
            const rolls = damageRolls(magikarp, target, 'Hydro Pump', false);
            return { target: target.name, startingHP: target.curHP(), rolls,
              lethalRollIndices: rolls.filter(damage => damage >= target.curHP()).length };
          }),
          suffixDamageBounds: [
            analyzeSuffix(magikarp, switchIn, 'Leafage', 'Leafage'),
            analyzeSuffix(magikarp, switchIn, 'Magical Leaf', 'Magical Leaf'),
            analyzeSuffix(magikarp, switchIn, 'Leafage', 'Magical Leaf'),
          ],
        }));
      }
    }
    return turns;
  }));
  console.log(JSON.stringify({ configuredRollReplay: reports }));
});

// RUN_DARIAN_BENCHMARK=1 npm test -- --runInBand --runTestsByPath src/extensions/simulator/prototypes/darian-replay.spec.ts -t benchmark
const benchmark = process.env.RUN_DARIAN_BENCHMARK === '1' ? test : test.skip;
benchmark('benchmark legacy search vs encounter-specific action ordering', () => {
  function run(ordered: boolean, checkpoint: boolean) {
    const { initial, Starly } = darianFixture();
    const startState = checkpoint ? withPlan([
      attack(Starly, 'Quick Attack'), attack(Starly, 'Aerial Ace'), attack(Starly, 'Quick Attack'),
    ], () => {
      let state = initial;
      for (let turn = 0; turn < 3; turn++) {
        const [outcome, ...others] = runUninstrumented(state);
        if (!outcome || others.length) throw Error('Expected a single configured-roll checkpoint');
        state = outcome.state;
      }
      return state;
    }) : initial;
    let turns = 0, outcomes = 0, changedTurns = 0;
    const startingHeap = process.memoryUsage().heapUsed;
    let sampledHeap = startingHeap;
    const spy = jest.spyOn(turnState, 'runTurn').mockImplementation(state => {
      const branches = runUninstrumented(state);
      turns++;
      outcomes += branches.length;
      if (turns % 64 === 0) sampledHeap = Math.max(sampledHeap, process.memoryUsage().heapUsed);
      if (!ordered) return branches;

      const active = state.player.active[0]?.pokemon;
      const target = state.cpu.active[0]?.pokemon;
      const next = target?.curHP() > 0 ? target : state.cpu.party.find(p => p.curHP() > 0);
      if (!next?.moves.some(move => move === 'Flail')) return branches;

      const firstAction = (branch: turnState.PossibleBattleFieldState) =>
        branch.history.filter(entry => entry.action.trainer.name === 'Player').at(-1)?.action.action;
      const preferred: typeof branches = [], rest: typeof branches = [];
      for (const branch of branches) {
        const action = firstAction(branch);
        const prefer = action?.type === 'switch' && active?.name === 'Starly' && action.switchIn?.name === 'Gossifleur'
          || action?.type === 'move' && active?.name === 'Gossifleur' &&
            action.move.move.name === (next.curHP() > 14 ? 'Leafage' : 'Magical Leaf');
        (prefer ? preferred : rest).push(branch);
      }
      if (preferred.length && branches[0] !== preferred[0]) changedTurns++;
      return [...preferred, ...rest];
    });
    const start = performance.now();
    let candidate: DecisionNode | null;
    let elapsedMs: number;
    try {
      candidate = findPlayerWinningPath(startState);
      elapsedMs = performance.now() - start;
    } finally {
      spy.mockRestore();
    }
    const line: string[] = [];
    for (let node: DecisionNode | 'WIN' | undefined = candidate ?? undefined;
      node && node !== 'WIN' && line.length < 21; node = node.cpuOutcomes.values().next().value) {
      line.push(node.playerAction);
    }
    return { elapsedMs, candidate: candidate !== null, turns, outcomes, changedTurns,
      exampleLineLength: line.length, firstAction: line[0],
      sampledHeapGrowthBytes: Math.max(sampledHeap, process.memoryUsage().heapUsed) - startingHeap };
  }
  const runUninstrumented = runTurn;
  for (const checkpoint of [false, true]) {
    run(false, checkpoint);
    run(true, checkpoint);
    const samples = [false, true, true, false, false, true, true, false, false, true].map(ordered => ({
      ordered, ...run(ordered, checkpoint),
    }));
    console.log(JSON.stringify({ checkpoint, darianSearchBenchmark: samples }));
    expect(samples.every(sample => sample.candidate)).toBe(true);
    if (checkpoint) expect(samples.filter(sample => sample.ordered).every(sample => sample.changedTurns > 0)).toBe(true);
  }

  const { Gossifleur } = darianFixture();
  const magikarp = OpposingTrainer('Fisherman Darian').find(p => p.hasItem('Focus Sash'));
  if (!magikarp) throw Error('Missing Focus Sash Magikarp');
  const suffix = analyzeSuffix(magikarp, Gossifleur, 'Leafage', 'Magical Leaf', true);
  console.log(JSON.stringify({ damageOnlyVerification: suffix }));
  expect(suffix).toMatchObject({
    guaranteedTwoHitKo: true, noFaintProvenByDamageBoundAlone: true,
    exactDamageCheck: { faintPaths: 0 },
  });
}, 120_000);

function hp(pokemon: Pokemon) {
  return { name: pokemon.name, hp: pokemon.curHP(), item: pokemon.item };
}

function damageRolls(attacker: Pokemon, defender: Pokemon, name: string, critical: boolean): number[] {
  const move = createMove(attacker, name);
  move.isCrit = critical;
  const rolls = calculate(gen, attacker.clone(), defender.clone(), move, new Field()).damage;
  if (!Array.isArray(rolls) || !rolls.length || !rolls.every((value): value is number => typeof value === 'number'))
    throw Error(`Expected flat damage rolls for ${name}`);
  return rolls;
}

function analyzeSuffix(magikarp: Pokemon, gossifleur: Pokemon, opener: string, finisher: string, compareExact = false) {
  if (!magikarp.hasItem('Focus Sash') || magikarp.curHP() !== magikarp.maxHP() ||
      gossifleur.curHP() !== gossifleur.maxHP() ||
      magikarp.moves.slice().sort().join() !== 'Flail,Hydro Pump,Tackle')
    throw Error('Suffix damage bound only applies to the fixed full-HP match-up');
  const outgoing = [false, true].flatMap(crit => damageRolls(gossifleur, magikarp, opener, crit));
  const remaining = [...new Set(outgoing.map(damage => Math.max(1, magikarp.curHP() - damage)))].sort((a, b) => a - b);
  function incomingAt(hp: number) {
    const attacker = magikarp.clone();
    attacker.originalCurHP = hp;
    return Object.fromEntries(attacker.moves.map(move => [
      move, [false, true].flatMap(crit => damageRolls(attacker, gossifleur, move, crit)),
    ]));
  }
  const fullRolls = incomingAt(magikarp.curHP());
  const afterHitRolls = remaining.map(hp => ({ hp, byMove: incomingAt(hp) }));
  const minimumFinishingDamage = Math.min(...remaining.flatMap(hp => {
    const defender = magikarp.clone();
    defender.originalCurHP = hp;
    defender.item = undefined; // Any remaining Focus Sash cannot trigger below full HP.
    return [false, true].flatMap(crit => damageRolls(gossifleur, defender, finisher, crit));
  }));
  const maxByMove = (rolls: Record<string, number[]>) => Object.fromEntries(
    Object.entries(rolls).map(([name, values]) => [name, Math.max(...values)]));
  const atFull = maxByMove(fullRolls);
  const afterFirstHit = afterHitRolls.map(({ hp, byMove }) => ({ hp, byMove: maxByMove(byMove) }));
  const worstBeforeHit = Math.max(...Object.values(atFull));
  const worstAfterHit = Math.max(...afterFirstHit.flatMap(({ byMove }) => Object.values(byMove)));
  // Maximum one enemy hit per turn; include either move order and ignore Oran recovery.
  const cumulativeUpperBound = worstBeforeHit + Math.max(worstBeforeHit, worstAfterHit) + worstAfterHit;
  // Same conservative damage-only model as the bound, but enumerate distinct totals
  // per stage. Include misses and a skipped finishing-turn attack as zero damage.
  const exactDamageCheck = compareExact ? (() => {
    const support = (...rolls: Record<string, number[]>[]) => [...new Set([0, ...rolls.flatMap(r => Object.values(r).flat())])];
    let distinctDamagePaths = 0, faintPaths = 0, maximumDamage = 0;
    for (const { byMove } of afterHitRolls) {
      for (const first of support(fullRolls)) for (const second of support(fullRolls, byMove))
        for (const third of support(byMove)) {
          distinctDamagePaths++;
          const damage = first + second + third;
          if (damage >= gossifleur.curHP()) faintPaths++;
          maximumDamage = Math.max(maximumDamage, damage);
        }
    }
    return { distinctDamagePaths, faintPaths, maximumDamage };
  })() : undefined;
  return { opener, finisher, assumptions: 'Second Magikarp only, both attacks hit, no other HP or stat changes, Focus Sash modeled; includes crits, ignores Oran recovery',
    minimumOpeningDamage: Math.min(...outgoing), minimumFinishingDamage,
    magikarpHpAfterFirstHit: remaining, atFull, afterFirstHit,
    guaranteedTwoHitKo: minimumFinishingDamage >= Math.max(...remaining),
    gossifleurStartingHp: gossifleur.curHP(), cumulativeUpperBound,
    noFaintProvenByDamageBoundAlone: cumulativeUpperBound < gossifleur.curHP(), exactDamageCheck };
}
