import {Field} from './field';
import {Generation} from './data/interface';
import {Move} from './move';
import {Pokemon} from './pokemon';
import {Result} from './result';

import { calculate } from './calc';

export interface MatchupResult {

}

export interface BattleResult {
	winner: Pokemon;
	turnOutcomes: TurnOutcome[];
}

export interface TurnOutcome {
	actions: MoveResult[];
	battleState: BattleState;
}

export interface BattleState {
	readonly playerPokemon: Pokemon;
	readonly cpuPokemon: Pokemon;
	readonly playerField: Field;
	readonly cpuField: Field;
}

export class BattleSimulator {
	private readonly originalState: BattleState;

	constructor(private readonly gen: Generation,
		private readonly playerPokemon: Pokemon, 
		private readonly cpuPokemon: Pokemon,
		private readonly playerField: Field, 
		private readonly cpuField: Field
	) {
		this.originalState = {
			 playerPokemon: playerPokemon.clone(),
			 cpuPokemon: cpuPokemon.clone(),
			 playerField: playerField.clone(),
			 cpuField: cpuField.clone()
		};
	}

	public getResult(): BattleResult {
		let outcome = this.simulateTurn();
		let battleState = outcome.battleState;
		let firstMover = outcome.actions[0].attacker;

		return {
			turnOutcomes: [outcome],
			winner: outcome.battleState.cpuPokemon.curHP() > outcome.battleState.playerPokemon.curHP() || 
			(firstMover === battleState.cpuPokemon && battleState.cpuPokemon.curHP() == 0 && battleState.playerPokemon.curHP() == 0) ? battleState.cpuPokemon : battleState.playerPokemon
		}
	}

	private simulateTurn(): TurnOutcome  {
		let firstMover: Pokemon = this.cpuPokemon.stats.spe >= this.playerPokemon.stats.spe ? this.cpuPokemon : this.playerPokemon;
		let playerDamageResults = calculateAllMoves(this.gen, this.playerPokemon, this.cpuPokemon, this.playerField);
		let cpuDamageResults = calculateAllMoves(this.gen, this.cpuPokemon, this.playerPokemon, this.cpuField);
		let cpuAssumedPlayerMove = BattleSimulator.findHighestDamageMove(getDamageRanges(playerDamageResults));
		let playerMove = this.calculatePlayerMove(playerDamageResults, this.cpuPokemon.curHP() / this.cpuPokemon.maxHP());
		let cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove);

		let firstMove = BattleSimulator.resolveTurnOrder(playerMove, cpuMove);
		let actions: MoveResult[] = [];
		let playerPokemon = this.playerPokemon;
		let cpuPokmeon = this.cpuPokemon;
		if (firstMove === playerMove) {
			actions.push(playerMove);
			cpuPokmeon = new Pokemon(this.gen, this.cpuPokemon.name, { curHP: Math.max(0, this.cpuPokemon.curHP() - playerMove.lowestRollDamage) });
			if (cpuPokmeon.curHP() >= 0) {
				actions.push(cpuMove);
				playerPokemon = new Pokemon(this.gen, this.playerPokemon.name, { curHP: Math.max(0, this.playerPokemon.curHP() - cpuMove.highestRollDamage) });
			}
		}
		else {
			actions.push(cpuMove);
			playerPokemon = new Pokemon(this.gen, this.playerPokemon.name, { curHP: Math.max(this.playerPokemon.curHP() - cpuMove.highestRollDamage) });
			
			if (playerPokemon.curHP() >= 0) {
				actions.push(playerMove);
				cpuPokmeon = new Pokemon(this.gen, this.cpuPokemon.name, { curHP: Math.max(this.cpuPokemon.curHP() - playerMove.lowestRollDamage) });
			}
		}

		return {
			actions,
			battleState: {
				cpuField: this.cpuField.clone(),
				playerField: this.playerField.clone(),
				cpuPokemon: cpuPokmeon.clone(),
				playerPokemon: playerPokemon.clone()
			}
		};
	}

	private calculateCpuMove(cpuResults: Result[], playerMove: MoveResult) {
		let highestDamageResult: Result = cpuResults[0];
		let damageResults = getDamageRanges(cpuResults);
		let maxDamageMove = BattleSimulator.findHighestDamageMove(damageResults);
		let cpuChosenMove: MoveResult = maxDamageMove;

		const playerKOsCpu = playerMove.highestRollHpPercentage >= this.cpuPokemon.curHP() / this.cpuPokemon.maxHP();
		const playerOutspeeds = this.playerPokemon.stats.spe > this.cpuPokemon.stats.spe;
		if (playerKOsCpu && playerOutspeeds) {
			let bestPriorityMove = BattleSimulator.findHighestDamageMove(damageResults.filter(result => result.move.priority > 0));
			if (bestPriorityMove)
				cpuChosenMove = bestPriorityMove;
		}

		return cpuChosenMove;
	}

	private calculatePlayerMove(playerResults: Result[], cpuCurrentHpPercentage: number): MoveResult {
		let highestDamageResult: Result = playerResults[0];
		let damageResults = getDamageRanges(playerResults);
		let playerChosenMove: MoveResult = damageResults[0];
		for (let result of damageResults) {
			if (result.highestRollHpPercentage > playerChosenMove.highestRollHpPercentage ||
				((playerChosenMove.highestRollHpPercentage >= cpuCurrentHpPercentage && result.highestRollHpPercentage >= cpuCurrentHpPercentage) &&
					result.move.priority > playerChosenMove.move.priority)
			)
				playerChosenMove = result;
		}

		return playerChosenMove;
	}

	private static moveKillsUser(user: Pokemon, moveResult: MoveResult): boolean {
		return !!(moveResult.move.recoil && user.curHP() - moveResult.move.recoil[0] <= 0);
	}

	private static resolveTurnOrder(playerMove: MoveResult, cpuMove: MoveResult): MoveResult {
		if (playerMove.attacker.stats.spe > cpuMove.attacker.stats.spe || playerMove.move.priority > cpuMove.move.priority)
			return playerMove;
		return cpuMove;
	}

	private static findHighestDamageMove(moveResults: MoveResult[]): MoveResult {
		let maxDamageMove: MoveResult = moveResults[0];
		for (let result of moveResults) {
			if (result.highestRollHpPercentage > maxDamageMove.highestRollHpPercentage)
				maxDamageMove = result;
		}

		return maxDamageMove;
	}
}

function simulateTurn(gen: Generation, playerPokemon: Pokemon, cpuPokemon: Pokemon, playerField: Field, cpuField: Field) {
	let firstMover: Pokemon = cpuPokemon.stats.spe >= playerPokemon.stats.spe ? cpuPokemon : playerPokemon;
	let playerDamageResults = calculateAllMoves(gen, playerPokemon, cpuPokemon, playerField);
	let cpuDamageResults = calculateAllMoves(gen, cpuPokemon, playerPokemon, cpuField);
}

function calculateAllMoves(gen: Generation, attacker: Pokemon, defender: Pokemon, attackerField: Field): Result[] {
	var results = [];
	for (var i = 0; i < 4; i++) {
		results[i] = calculate(gen, attacker, defender, new Move(gen, attacker.moves[i]), attackerField);
	}
	return results;
}

// function calculationsColors(p1info, p2) {
// 	if (!p2) {
// 		var p2info = $("#p2");
// 		var p2 = createPokemon(p2info);
// 	}
// 	var p1 = createPokemon(p1info);
// 	var p1field = createField();
// 	var p2field = p1field.clone().swap();

// 	damageResults = calculateAllMoves(gen, p1, p1field, p2, p2field);
// 	p1 = damageResults[0][0].attacker;
// 	p2 = damageResults[1][0].attacker;
// 	p1.maxDamages = [];
// 	p2.maxDamages = [];

// 	var p1speed = p1.stats.spe;
// 	var p2speed = p2.stats.spe;
// 	//Faster Tied Slower
// 	var fastest = p1speed > p2speed ? "F" : p1speed < p2speed ? "S" : p1speed === p2speed ? "T" : undefined;
// 	var result, highestRoll, lowestRoll, damage = 0;
// 	//goes from the most optimist to the least optimist
// 	var p1KO = 0, p2KO = 0;
// 	//Highest damage
// 	var p1HD = 0, p2HD = 0;
// 	// Lowest damage
// 	var p1LD = 0, p2LD = 0;

// 	const p1DamageRanges = getDamageRanges(damageResults[0]);
// 	const p2DamageRanges = getDamageRanges(damageResults[1]);
// 	p1HD = Math.max(...p1DamageRanges.map(r => r.highestRoll));
// 	p2HD = Math.max(...p2DamageRanges.map(r => r.highestRoll));

// 	// The lowest damage roll for the still the best move choice
// 	p1LD = Math.max(...p1DamageRanges.map(r => r.lowestRoll));
// 	p2LD = Math.max(...p2DamageRanges.map(r => r.lowestRoll));

// 	if (p1LD >= 100) {
// 		p1KO = 1;
// 	}
// 	else if (p1HD >= 100 && p1KO == 0) {
// 		p1KO = 2;
// 	}

// 	if (p2LD >= 100) {
// 		p2KO = 4;
// 	} else if (p2HD >= 100 && p2KO < 3) {
// 		p2KO = 3;
// 	}

// 	// Check if p1 can switch in and 1v1
// 	let p1DiesInHits = Math.max(1, Math.ceil(100 / p2HD));
// 	let p2DiesInHits = Math.max(1, Math.ceil(100 / p1LD));
// 	if (p1DiesInHits - 1 > p2DiesInHits || // KOs even if slower
// 		(p1DiesInHits - 1 === p2DiesInHits && fastest === "F")) // Takes the pivot and KOs first
// 	{
// 		if (p2DiesInHits === 1) {

// 		}
// 		// p1 can switch into any move and ko
// 		return { speed: fastest, code: p2DiesInHits === 1 ? "switch-ohko" : "1v1" };
// 	}

// 	let highestRollOfLeastPowerfulMove = Math.min(...p2DamageRanges.filter(d => d.move.category !== "Status" && !(d.move.bp === 0 && d.highestRoll === 0)).map(d => d.highestRoll));
// 	let p1HealthAfterPivot = 100 - highestRollOfLeastPowerfulMove;
// 	let p1DiesInHitsAfterPivot = Math.floor(Math.max(1, p1HealthAfterPivot / p2HD));
// 	if (p1DiesInHitsAfterPivot > p2DiesInHits || // KOs even if slower
// 		(p1DiesInHitsAfterPivot === p2DiesInHits && fastest === "F")) { // KOs first
// 		// p1 can switch into an advantageous move and ko
// 		return { speed: fastest, code: "1v1-pivot" };
// 	}


// 	// Checks if the pokemon walls it
// 	// i wouldn't mind change this algo for a smarter one.

// 	// if the adversary don't three shots our pokemon
// 	if (Math.round(p2HD * 3) < 100) {
// 		// And if our pokemon does more damage
// 		if (p1HD > p2HD) {
// 			if (p1HD > 100) {
// 				// Then i consider it a wall that may OHKO
// 				return { speed: fastest, code: "WMO" };
// 			}
// 			// if not Then i consider it a good wall
// 			return { speed: fastest, code: "W" };
// 		}
// 	}
// 	let p1KOText = p1KO > 0 ? p1KO.toString() : "";
// 	let p2KOText = p2KO > 0 ? p2KO.toString() : "";
// 	return { speed: fastest, code: p1KOText + p2KOText };
// }

export interface MoveResult {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	lowestRollDamage: number;
	lowestRollHpPercentage: number;
	highestRollDamage: number;
	highestRollHpPercentage: number;
}

function getDamageRanges(attackerResults: Result[], expectedHits?: number): MoveResult[] {
	/* Returns array of highest damage % inflicted per move
		[{ lowestRoll: 85.6, higestRoll: 101.5 }, ...x4]
	*/
	var attacker = attackerResults[0].attacker;
	var defender = attackerResults[0].defender;
	var highestRoll, lowestRoll, damage = 0;
	//goes from the most optimist to the least optimist
	var p1KO = 0, p2KO = 0;
	//Highest damage
	var p1HD = 0, p2HD = 0;

	return attackerResults.map((result, i) => {
		let resultDamage = result.damage as number[];
		let lowestHitDamage = resultDamage[0] ? resultDamage[0] : result.damage as number;
		let highestHitDamage = (result.damage as number[])[15] ? resultDamage[15] : result.damage as number;
		let getDamagePct = (hitDamage: number) => hitDamage * (new Move(attacker.gen, attacker.moves[i]).hits / defender.stats.hp * 100);
		return {
			attacker,
			defender,
			move: result.move,
			lowestRollDamage: lowestHitDamage,
			lowestRollHpPercentage: getDamagePct(lowestHitDamage),
			highestRollDamage: highestHitDamage,
			highestRollHpPercentage: getDamagePct(highestHitDamage),
		};
	});
}