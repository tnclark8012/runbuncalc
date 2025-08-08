import { A, I, calculate, Field, GenerationNum, Pokemon } from '@smogon/calc';
import { BattleSimulator } from '../simulator/simulator';
import { BattleFieldState } from '../simulator/moveScoring.contracts';
import { curHPPercentage } from '../simulator/utils';

export function updateColorCodes(): void {
	var speCheck = (document.getElementById("cc-spe-border") as HTMLInputElement).checked;
	var ohkoCheck = (document.getElementById("cc-ohko-color") as HTMLInputElement).checked;
	if (!speCheck && !ohkoCheck) {
		return
	}
	var pMons = document.getElementsByClassName("trainer-pok left-side");
	// i calc here to alleviate some calculation
	var p1info = $("#p1");
	var p2info = $("#p2");
	var p1 = createPokemon(p1info);
	var p2 = createPokemon(p2info);
	
	let playerPokemon = [];
	for (let i = 0; i < pMons.length; i++) {
		playerPokemon.push(createPokemon(pMons[i].getAttribute("data-id")));
	}
	let pokemonResults = getCalculationColors(playerPokemon, p2);
	for (let i = 0; i < pMons.length; i++) {
		let set = pMons[i].getAttribute("data-id");
		let pokemonResult = pokemonResults[i];
		if (speCheck && ohkoCheck) {
			pMons[i].className = `trainer-pok left-side mon-speed-${pokemonResult.speed} mon-dmg-${pokemonResult.code}`;
		}
		else if (speCheck) {
			pMons[i].className = `trainer-pok left-side mon-speed-${pokemonResult.speed}`;
		}
		else if (ohkoCheck) {
			pMons[i].className = `trainer-pok left-side mon-dmg-${pokemonResult.code}`;
		}

		pMons[i].classList.toggle('best', !!(pokemonResult as any).best);
	}
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

function getCalculationColors(playerPokemon: A.Pokemon[], cpuPokemon: A.Pokemon): CalculationColor[] {
	var p1field = createField();
	var p2field = p1field.clone().swap();

	const result: CalculationColor[] = [];
	const diff: Array<{ name: string, legacy: MatchupResultCode, simulated: MatchupResultCode }> = [];
	
	for (let playerMon of playerPokemon) {
		let legacy = getLegacyCalculationResult(playerMon, cpuPokemon, p1field, p2field);
		let simulated = getSimulatedCalculationResult(playerMon, cpuPokemon, p1field, p2field);
		result.push(legacy);

		if (legacy.code !== simulated.code)
			diff.push({ name: playerMon.name, legacy: legacy.code, simulated: simulated.code });
	}

	let bestMon = result
		.filter(r => r.type === 'simulator')
		.sort((a, b) => curHPPercentage(a.finalState.playerSide.pokemon) - curHPPercentage(b.finalState.playerSide.pokemon))
		.at(0);
		if (bestMon)
			(bestMon as any).best = true;

	if (diff.length)
		console.warn('Simulator and legacy impl diverge:', diff);

	return result;
}

function getSimulatedCalculationResult(p1: A.Pokemon, p2: A.Pokemon, p1Field: Field, p2Field: Field): CalculationColor {
	var p1speed = p1.stats.spe;
	var p2speed = p2.stats.spe;
	//Faster Tied Slower
	var fastest: SpeedTier = p1speed > p2speed ? "F" : p1speed < p2speed ? "S" : p1speed === p2speed ? "T" : "T";

	const simulator = new BattleSimulator(gen, p1, p2, p1Field, p2Field);
	const result = simulator.getResult({ playerSwitchingIn: true });
	let code: MatchupResultCode;
	if (result.winner.equals(p1)) {
		const turnsOut = result.turnOutcomes.slice(1);
		if (turnsOut.length == 1) {
			if (turnsOut[0].actions[0].attacker.equals(result.winner))
				code = MatchupResultCode.SwitchAndFastKO;
			else
				code = MatchupResultCode.SwitchAndGetOneHitKO;
		}
		else {
			code = MatchupResultCode.SafeOneVOne;
		}

		return { type: 'simulator', speed: fastest, code, finalState: result.turnOutcomes.at(-1)!.endOfTurnState };
	}
	
	return getLegacyCalculationResult(p1, p2, p1Field, p2Field);
}

function getLegacyCalculationResult(p1: A.Pokemon, p2: A.Pokemon, p1Field: Field, p2Field: Field): LegacyCalculationColor {
	let damageResults = calculateAllMoves(gen, p1, p1Field, p2, p2Field);
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

function calculateAllMoves(gen: GenerationNum | I.Generation, p1: A.Pokemon, p1field: Field, p2: A.Pokemon, p2field: Field, double?: number): A.Result[][] {
	double = double ? 2 : 0;
	checkStatBoost(p1, p2);
	var results: A.Result[][] = [[], [], [], []];
	for (var i = 0; i < 4; i++) {
		results[0 + double][i] = calculate(gen, p1, p2, (p1.moves as any)[i], p1field);
		results[1 + double][i] = calculate(gen, p2, p1, (p2.moves[i] as any), p2field);
	}
	return results;
}