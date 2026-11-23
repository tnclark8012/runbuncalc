import { calculate, Field, GenerationNum, Pokemon, Result } from '@smogon/calc';
import { Generation } from '@smogon/calc/dist/data/interface';
import { gen } from '../configuration';
import { BattleFieldState } from '../simulator/moveScoring.contracts';
import { BattleSimulator } from '../simulator/simulator';
import { curHPPercentage } from '../simulator/utils';

const MAX_CACHED_OPPONENTS = 20;
const TIME_SLICE_MS = 12;

/** Results keyed by opponent/field, then by player Pokemon. */
const matchupCache = new Map<string, Map<string, CalculationColor>>();
let latestRun = 0;

function yieldToBrowser(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve));
}

function getOpponentCache(key: string): Map<string, CalculationColor> {
	let cache = matchupCache.get(key);
	if (cache) {
		// Refresh recency for LRU eviction.
		matchupCache.delete(key);
	} else {
		cache = new Map();
		if (matchupCache.size >= MAX_CACHED_OPPONENTS)
			matchupCache.delete(matchupCache.keys().next().value!);
	}
	matchupCache.set(key, cache);
	return cache;
}

// createPokemon assigns a random id on every call, so it can't be part of a cache key.
function toCacheKey(value: unknown): string {
	return JSON.stringify(value, (key, val) => key === 'id' ? undefined : val);
}

function applyColorCode(element: Element, result: CalculationColor, speCheck: boolean, ohkoCheck: boolean): void {
	if (speCheck && ohkoCheck) {
		element.className = `trainer-pok left-side mon-speed-${result.speed} mon-dmg-${result.code}`;
	}
	else if (speCheck) {
		element.className = `trainer-pok left-side mon-speed-${result.speed}`;
	}
	else if (ohkoCheck) {
		element.className = `trainer-pok left-side mon-dmg-${result.code}`;
	}
}

export async function updateColorCodes(): Promise<void> {
	// Superseded runs bail out, so rapid selection changes only pay for the latest one.
	const run = ++latestRun;
	await yieldToBrowser();
	if (run !== latestRun)
		return;

	var speCheck = (document.getElementById("cc-spe-border") as HTMLInputElement).checked;
	var ohkoCheck = (document.getElementById("cc-ohko-color") as HTMLInputElement).checked;
	if (!speCheck && !ohkoCheck) {
		return
	}
	const pMons = Array.from(document.getElementsByClassName("trainer-pok left-side"));
	const cpuPokemon = createPokemon($("#p2"));
	const field = createField();
	const cache = getOpponentCache(toCacheKey([
		cpuPokemon,
		field,
		$('#StatBoostL').prop("checked"),
		$('#StatBoostR').prop("checked"),
	]));

	const results: CalculationColor[] = [];
	let sliceStart = performance.now();
	for (const element of pMons) {
		if (performance.now() - sliceStart > TIME_SLICE_MS) {
			await yieldToBrowser();
			if (run !== latestRun)
				return;
			sliceStart = performance.now();
		}

		const playerMon = createPokemon(element.getAttribute("data-id"));
		const key = toCacheKey(playerMon);
		let result = cache.get(key);
		if (!result) {
			result = getSimulatedCalculationResult(playerMon, cpuPokemon, field);
			cache.set(key, result);
		}
		results.push(result);
		applyColorCode(element, result, speCheck, ohkoCheck);
		element.classList.remove('best');
	}

	const best = getBestResult(results);
	if (best)
		pMons[results.indexOf(best)].classList.add('best');
}

export type SpeedTier = 'F' | 'S' | 'T';

export enum MatchupResultCode {
	/** Switch OHKO */
	SwitchAndGetOneHitKO = 'switch-ohko',
	/** Can switch in and 1v1 */
	OneVOne = '1v1',
	/** Can 1v1 if switching in on the right move */
	OneVOne_Pivot = '1v1-pivot',
	GetsOneHitKO = 'ohkos',
	GetsOneHitKOd = 'ohkod',
	MaybeGetsOneHitKO = 'maybe-ohkos',
	MaybeGetsOneHitKOd = 'maybe-ohkod',
	MutualOneHitKOs = 'mutual-ohko',
	MutualMaybeOneHitKOs = 'mutual-maybe-ohko',
	GetsOneHitKO_MaybeGetsOneHitKOd = 'ohkos-maybe-ohkod',
	MaybeGetsOneHitKO_GetsOneHitKOd = 'maybe-ohko-ohkod',
	SafeOneVOne = 'safe-1v1',
	SwitchAndFastKO = 'switch-ohko-fast',
	Neutral = 'neutral',
}

export interface LegacyCalculationColor {
	type: 'legacy';
	speed: SpeedTier;
	code: MatchupResultCode;
}

export interface SimulatorCalculationColor {
	type: 'simulator';
	speed: SpeedTier;
	code: MatchupResultCode;
	finalState: BattleFieldState;
}

export type CalculationColor = LegacyCalculationColor | SimulatorCalculationColor;

function getBestResult(results: CalculationColor[]): CalculationColor | undefined {
	let best: SimulatorCalculationColor | undefined;
	for (const result of results) {
		if (result.type !== 'simulator')
			continue;
		if (!best || curHPPercentage(result.finalState.player.active[0].pokemon) > curHPPercentage(best.finalState.player.active[0].pokemon))
			best = result;
	}
	return best;
}

function getSimulatedCalculationResult(p1: Pokemon, p2: Pokemon, field: Field): CalculationColor {
	var p1speed = p1.stats.spe;
	var p2speed = p2.stats.spe;
	//Faster Tied Slower
	var fastest: SpeedTier = p1speed > p2speed ? "F" : p1speed < p2speed ? "S" : p1speed === p2speed ? "T" : "T";

	const simulator = new BattleSimulator(gen, p1.clone(), p2.clone(), field);
	const result = simulator.getResult({ playerSwitchingIn: true });
	let code: MatchupResultCode;
	const playerWon = result.winner.equals(p1);
	const turnsOut = result.turnOutcomes.slice(1);
	if (turnsOut.length == 1) {
		if (turnsOut[0].actions[0].attacker.equals(result.winner)) {
			code = playerWon ? MatchupResultCode.SwitchAndFastKO : MatchupResultCode.GetsOneHitKOd;
		}
		else {
			code = playerWon ? MatchupResultCode.SwitchAndGetOneHitKO : MatchupResultCode.GetsOneHitKOd;
		}
	}
	else if (playerWon) {
		code = MatchupResultCode.SafeOneVOne;
	}
	else {
		// Legacy calc applies stat boosts in place, so keep the shared CPU Pokemon untouched.
		return getLegacyCalculationResult(p1.clone(), p2.clone(), field);
	}

	return { type: 'simulator', speed: fastest, code, finalState: result.turnOutcomes.at(-1)!.endOfTurnState };
}

function getLegacyCalculationResult(p1: Pokemon, p2: Pokemon, field: Field): LegacyCalculationColor {
	let damageResults = calculateAllMoves(gen, p1, field, p2, field.swap());
	p1 = damageResults[0][0].attacker;
	p2 = damageResults[1][0].attacker;
	(p1 as any).maxDamages = [];
	(p2 as any).maxDamages = [];

	var p1speed = p1.stats.spe;
	var p2speed = p2.stats.spe;
	//Faster Tied Slower
	var fastest: SpeedTier = p1speed > p2speed ? "F" : p1speed < p2speed ? "S" : p1speed === p2speed ? "T" : "T";
	var result, highestRoll, lowestRoll, damage = 0;
	//goes from the most optimist to the least optimist
	var p1KO: MatchupResultCode | undefined, p2KO: MatchupResultCode | undefined;
	//Highest damage
	var p1HD = 0, p2HD = 0;
	// Lowest damage
	var p1LD = 0, p2LD = 0;

	const p1DamageRanges = getDamageRanges(damageResults[0]);
	const p2DamageRanges = getDamageRanges(damageResults[1]);
	p1HD = Math.max(...p1DamageRanges.map(r => r.highestRoll));
	p2HD = Math.max(...p2DamageRanges.map(r => r.highestRoll));

	// The lowest damage roll for the still the best move choice
	p1LD = Math.max(...p1DamageRanges.map(r => r.lowestRoll));
	p2LD = Math.max(...p2DamageRanges.map(r => r.lowestRoll));

	if (p1LD >= 100) {
		p1KO = MatchupResultCode.GetsOneHitKO;
	}
	else if (p1HD >= 100 && p1KO != MatchupResultCode.GetsOneHitKO) {
		p1KO = MatchupResultCode.MaybeGetsOneHitKO;
	}

	if (p2LD >= 100) {
		p2KO = MatchupResultCode.GetsOneHitKOd;
	} else if (p2HD >= 100 && p2KO != MatchupResultCode.GetsOneHitKO) {
		p2KO = MatchupResultCode.MaybeGetsOneHitKOd;
	}

	// Check if p1 can switch in and 1v1
	let p1DiesInHits = Math.max(1, Math.ceil(100 / p2HD));
	let p2DiesInHits = Math.max(1, Math.ceil(100 / p1LD));
	if (p1DiesInHits - 1 > p2DiesInHits || // KOs even if slower
		(p1DiesInHits - 1 === p2DiesInHits && fastest === "F")) // Takes the pivot and KOs first
	{
		if (p2DiesInHits === 1) {

		}
		// p1 can switch into any move and ko
		return { type: 'legacy', speed: fastest, code: p2DiesInHits === 1 ? MatchupResultCode.SwitchAndGetOneHitKO : MatchupResultCode.OneVOne };
	}

	let highestRollOfLeastPowerfulMove = Math.min(...p2DamageRanges.filter(d => d.move.category !== "Status" && !(d.move.bp === 0 && d.highestRoll === 0)).map(d => d.highestRoll));
	let p1HealthAfterPivot = 100 - highestRollOfLeastPowerfulMove;
	let p1DiesInHitsAfterPivot = Math.floor(Math.max(1, p1HealthAfterPivot / p2HD));
	if (p1DiesInHitsAfterPivot > p2DiesInHits || // KOs even if slower
		(p1DiesInHitsAfterPivot === p2DiesInHits && fastest === "F")) { // KOs first
		// p1 can switch into an advantageous move and ko
		return { type: 'legacy', speed: fastest, code: MatchupResultCode.OneVOne_Pivot };
	}


	// Checks if the pokemon walls it
	// i wouldn't mind change this algo for a smarter one.

	// if the adversary don't three shots our pokemon
	if (Math.round(p2HD * 3) < 100) {
		// And if our pokemon does more damage
		if (p1HD > p2HD) {
			if (p1HD > 100) {
				// Then i consider it a wall that may OHKO
				return { type: 'legacy', speed: fastest, code: "WMO" as any };
			}
			// if not Then i consider it a good wall
			return { type: 'legacy', speed: fastest, code: "W" as any };
		}
	}
	// p1KO = p1KO > 0 ? p1KO.toString() : "";
	// p2KO = p2KO > 0 ? p2KO.toString() : "";
	let code = p1KO || p2KO;
	if (p1KO && p2KO) {
		if (p1KO == MatchupResultCode.GetsOneHitKO)
			code = p2KO == MatchupResultCode.GetsOneHitKO ? MatchupResultCode.MutualOneHitKOs : MatchupResultCode.GetsOneHitKO_MaybeGetsOneHitKOd;
		else if (p1KO == MatchupResultCode.MaybeGetsOneHitKO)
			code = p2KO == MatchupResultCode.GetsOneHitKO ? MatchupResultCode.MaybeGetsOneHitKO_GetsOneHitKOd : MatchupResultCode.MutualMaybeOneHitKOs;
	}

	return { type: 'legacy', speed: fastest, code: code! };
}

function calculateAllMoves(gen: GenerationNum | Generation, p1: Pokemon, p1field: Field, p2: Pokemon, p2field: Field, double?: number): Result[][] {
	double = double ? 2 : 0;
	checkStatBoost(p1, p2);
	var results: Result[][] = [[], [], [], []];
	for (var i = 0; i < 4; i++) {
		results[0 + double][i] = calculate(gen, p1, p2, (p1.moves as any)[i], p1field);
		results[1 + double][i] = calculate(gen, p2, p1, (p2.moves[i] as any), p2field);
	}
	return results;
}