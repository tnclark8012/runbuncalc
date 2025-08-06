import { A, I, calculate, Field, GenerationNum } from '@smogon/calc';

export function updateColorCodes(): void {
	var speCheck = (document.getElementById("cc-spe-border") as HTMLInputElement).checked;
	var ohkoCheck = (document.getElementById("cc-ohko-color") as HTMLInputElement).checked;
	if (!speCheck && !ohkoCheck) {
		return
	}
	var pMons = document.getElementsByClassName("trainer-pok left-side");
	// i calc here to alleviate some calculation
	var p2info = $("#p2");
	var p2 = createPokemon(p2info);
	for (let i = 0; i < pMons.length; i++) {
		let set = pMons[i].getAttribute("data-id");
		let idColor = getCalculationColor(set, p2);
		if (speCheck && ohkoCheck) {
			pMons[i].className = `trainer-pok left-side mon-speed-${idColor.speed} mon-dmg-${idColor.code}`;
		}
		else if (speCheck) {
			pMons[i].className = `trainer-pok left-side mon-speed-${idColor.speed}`;
		}
		else if (ohkoCheck) {
			pMons[i].className = `trainer-pok left-side mon-dmg-${idColor.code}`;
		}
	}
}

export type SpeedTier = 'F' | 'S' | 'T';
export interface CalculationColor {
  speed: SpeedTier;
  code: string;
}

function getCalculationColor(p1info: JQuery<HTMLElement> | string | null, p2: A.Pokemon | undefined): CalculationColor {
	if (!p2) {
		var p2info = $("#p2");
		p2 = createPokemon(p2info);
	}
	var p1 = createPokemon(p1info);
	var p1field = createField();
	var p2field = p1field.clone().swap();

	let damageResults = calculateAllMoves(gen, p1, p1field, p2, p2field);
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
	var p1KO = 0, p2KO = 0;
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
		p1KO = 1;
	}
	else if (p1HD >= 100 && p1KO == 0) {
		p1KO = 2;
	}

	if (p2LD >= 100) {
		p2KO = 4;
	} else if (p2HD >= 100 && p2KO < 3) {
		p2KO = 3;
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
		return { speed: fastest, code: p2DiesInHits === 1 ? "switch-ohko" : "1v1" };
	}

	let highestRollOfLeastPowerfulMove = Math.min(...p2DamageRanges.filter(d => d.move.category !== "Status" && !(d.move.bp === 0 && d.highestRoll === 0)).map(d => d.highestRoll));
	let p1HealthAfterPivot = 100 - highestRollOfLeastPowerfulMove;
	let p1DiesInHitsAfterPivot = Math.floor(Math.max(1, p1HealthAfterPivot / p2HD));
	if (p1DiesInHitsAfterPivot > p2DiesInHits || // KOs even if slower
		(p1DiesInHitsAfterPivot === p2DiesInHits && fastest === "F")) { // KOs first
		// p1 can switch into an advantageous move and ko
		return { speed: fastest, code: "1v1-pivot" };
	}


	// Checks if the pokemon walls it
	// i wouldn't mind change this algo for a smarter one.

	// if the adversary don't three shots our pokemon
	if (Math.round(p2HD * 3) < 100) {
		// And if our pokemon does more damage
		if (p1HD > p2HD) {
			if (p1HD > 100) {
				// Then i consider it a wall that may OHKO
				return { speed: fastest, code: "WMO" };
			}
			// if not Then i consider it a good wall
			return { speed: fastest, code: "W" };
		}
	}
	// p1KO = p1KO > 0 ? p1KO.toString() : "";
	// p2KO = p2KO > 0 ? p2KO.toString() : "";
	return { speed: fastest, code: `${p1KO || ''}${p2KO || ''}` };
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