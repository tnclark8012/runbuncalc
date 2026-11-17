import { calculate, Field, Pokemon } from '@smogon/calc';
import { attack, gen, PlannedPlayerActionProvider, switchTo, usingHeuristics } from '../../configuration';
import { OpposingTrainer } from '../../trainer-sets';
import { createMove } from '../moveScoring';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from '../moveScoring.contracts';
import { runTurn, startTurn } from '../turn-state';
import { getBox } from '../playthrough/museum.collection';

// Throwaway diagnostic: the legacy simulator does not enumerate game RNG.
test('compare the two Darian switch timings under configured simulator rolls', () => {
  const { Starly, Gossifleur, Poochyena, Turtwig, Surskit } = getBox();
  const team = [Starly, Gossifleur, Poochyena, Turtwig, Surskit];
  for (const mon of team) mon.item = 'Oran Berry' as typeof mon.item;
  const initial = new BattleFieldState(
    new PlayerTrainer([new PokemonPosition(Starly, true)], team.slice(1)),
    new CpuTrainer([], OpposingTrainer('Fisherman Darian')), new Field());
  const prefix = [attack(Starly, 'Quick Attack'), attack(Starly, 'Aerial Ace'), attack(Starly, 'Quick Attack')];
  const suffix = [switchTo(Gossifleur), attack(Gossifleur, 'Leafage'), attack(Gossifleur, 'Leafage')];
  const magicalLeaf = attack(Gossifleur, 'Magical Leaf');
  const reports = [
    [...prefix, attack(Starly, 'Aerial Ace'), ...suffix],
    [...prefix, ...suffix],
    [...prefix, suffix[0], magicalLeaf, magicalLeaf],
    [...prefix, suffix[0], suffix[1], magicalLeaf],
  ].map((line, lineIndex) => usingHeuristics({ playerActionProvider: new PlannedPlayerActionProvider(line.map(a => [a])) }, () => {
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

function analyzeSuffix(magikarp: Pokemon, gossifleur: Pokemon, opener: string, finisher: string) {
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
      move, Math.max(...[false, true].flatMap(crit => damageRolls(attacker, gossifleur, move, crit))),
    ]));
  }
  const atFull = incomingAt(magikarp.curHP());
  const afterFirstHit = remaining.map(hp => ({ hp, byMove: incomingAt(hp) }));
  const minimumFinishingDamage = Math.min(...remaining.flatMap(hp => {
    const defender = magikarp.clone();
    defender.originalCurHP = hp;
    defender.item = undefined; // Any remaining Focus Sash cannot trigger below full HP.
    return [false, true].flatMap(crit => damageRolls(gossifleur, defender, finisher, crit));
  }));
  const worstBeforeHit = Math.max(...Object.values(atFull));
  const worstAfterHit = Math.max(...afterFirstHit.flatMap(({ byMove }) => Object.values(byMove)));
  // Maximum one enemy hit per turn; include either move order and ignore Oran recovery.
  const cumulativeUpperBound = worstBeforeHit + Math.max(worstBeforeHit, worstAfterHit) + worstAfterHit;
  return { opener, finisher, assumptions: 'Second Magikarp only, both attacks hit, no other HP or stat changes, Focus Sash modeled; includes crits, ignores Oran recovery',
    minimumOpeningDamage: Math.min(...outgoing), minimumFinishingDamage,
    magikarpHpAfterFirstHit: remaining, atFull, afterFirstHit,
    guaranteedTwoHitKo: minimumFinishingDamage >= Math.max(...remaining),
    gossifleurStartingHp: gossifleur.curHP(), cumulativeUpperBound,
    noFaintProvenByDamageBoundAlone: cumulativeUpperBound < gossifleur.curHP() };
}
