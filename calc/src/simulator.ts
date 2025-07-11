import {Field} from './field';
import {Generation, StatsTable} from './data/interface';
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
	private simulationState!: BattleState;
	constructor(private readonly gen: Generation,
		playerPokemon: Pokemon, 
		cpuPokemon: Pokemon,
		playerField: Field, 
		cpuField: Field
	) {
		this.originalState = {
			 playerPokemon: playerPokemon.clone(),
			 cpuPokemon: cpuPokemon.clone(),
			 playerField: playerField.clone(),
			 cpuField: cpuField.clone()
		};
	}

	public getResult(): BattleResult {
		this.simulationState = {
			playerPokemon: this.originalState.playerPokemon.clone(),
			 cpuPokemon: this.originalState.cpuPokemon.clone(),
			 playerField: this.originalState.playerField.clone(),
			 cpuField: this.originalState.cpuField.clone()
		};
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
		let playerDamageResults = calculateAllMoves(this.gen, this.simulationState.playerPokemon, this.simulationState.cpuPokemon, this.simulationState.playerField);
		let cpuDamageResults = calculateAllMoves(this.gen, this.simulationState.cpuPokemon, this.simulationState.playerPokemon, this.simulationState.cpuField);
		let cpuAssumedPlayerMove = BattleSimulator.findHighestDamageMove(getDamageRanges(playerDamageResults));
		let playerMove = this.calculatePlayerMove(playerDamageResults, this.simulationState.cpuPokemon.curHP() / this.simulationState.cpuPokemon.maxHP());
		let cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove);

		let firstMove = BattleSimulator.resolveTurnOrder(playerMove, cpuMove);
		let actions: MoveResult[] = [];
		let playerPokemon = this.simulationState.playerPokemon;
		let cpuPokemon = this.simulationState.cpuPokemon;
		if (firstMove === playerMove) {
			actions.push(playerMove);
			let boosts = getBoosts(playerMove);
			playerPokemon = new Pokemon(this.gen, playerPokemon.name, { boosts: boosts.attacker });
			cpuPokemon = new Pokemon(this.gen, this.simulationState.cpuPokemon.name, { 
				curHP: Math.max(0, cpuPokemon.curHP() - playerMove.lowestRollDamage),
				item: consumesDefenderItem(cpuPokemon, playerMove.move) ? undefined : cpuPokemon.item,
				boosts: mergeBoosts(cpuPokemon.boosts, boosts.defender)
			});
			if (cpuPokemon.curHP() > 0) {
				actions.push(cpuMove);
				let boosts = getBoosts(cpuMove);
				cpuPokemon = new Pokemon(this.gen, cpuPokemon.name, { boosts: mergeBoosts(cpuPokemon.boosts, boosts.attacker) });
				playerPokemon = new Pokemon(this.gen, playerPokemon.name, { 
					curHP: Math.max(0, playerPokemon.curHP() - cpuMove.highestRollDamage),
					item: consumesDefenderItem(playerPokemon, cpuMove.move) ? undefined : playerPokemon.item,
					boosts: mergeBoosts(playerPokemon.boosts, boosts.defender)
				});
			}
		}
		else {
			actions.push(cpuMove);
			let boosts = getBoosts(cpuMove);
			cpuPokemon = new Pokemon(this.gen, cpuPokemon.name, { boosts: mergeBoosts(cpuPokemon.boosts, boosts.attacker) });
			playerPokemon = new Pokemon(this.gen, this.simulationState.playerPokemon.name, { 
				curHP: Math.max(playerPokemon.curHP() - cpuMove.highestRollDamage),
				item: consumesDefenderItem(playerPokemon, cpuMove.move) ? undefined : playerPokemon.item,
				boosts: mergeBoosts(playerPokemon.boosts, boosts.defender)
			});
			
			if (playerPokemon.curHP() > 0) {
				actions.push(playerMove);
				let boosts = getBoosts(playerMove);
				playerPokemon = new Pokemon(this.gen, playerPokemon.name, { boosts: boosts.attacker });
				cpuPokemon = new Pokemon(this.gen, this.simulationState.cpuPokemon.name, { 
					curHP: Math.max(this.simulationState.cpuPokemon.curHP() - playerMove.lowestRollDamage),
					item: consumesDefenderItem(cpuPokemon, playerMove.move) ? undefined : cpuPokemon.item,
					boosts: mergeBoosts(cpuPokemon.boosts, boosts.defender),
				});
			}
		}

		return {
			actions,
			battleState: {
				cpuField: this.simulationState.cpuField.clone(),
				playerField: this.simulationState.playerField.clone(),
				cpuPokemon: cpuPokemon.clone(),
				playerPokemon: playerPokemon.clone()
			}
		};
	}

	private calculateCpuMove(cpuResults: Result[], playerMove: MoveResult) {
		let highestDamageResult: Result = cpuResults[0];
		let damageResults = getDamageRanges(cpuResults);
		let maxDamageMove = BattleSimulator.findHighestDamageMove(damageResults);
		let cpuChosenMove: MoveResult = maxDamageMove;

		const playerKOsCpu = playerMove.highestRollHpPercentage >= this.simulationState.cpuPokemon.curHP() / this.simulationState.cpuPokemon.maxHP();
		const playerOutspeeds = this.simulationState.playerPokemon.stats.spe > this.simulationState.cpuPokemon.stats.spe;
		const cpuHasLifeSaver = hasLifeSavingAbility(this.simulationState.cpuPokemon) || hasLifeSavingItem(this.simulationState.cpuPokemon);
		
		if (playerKOsCpu && playerOutspeeds && !cpuHasLifeSaver) {
			let bestPriorityMove = BattleSimulator.findHighestDamageMove(damageResults.filter(result => result.move.priority > 0));
			if (bestPriorityMove)
				cpuChosenMove = bestPriorityMove;
		}

		return cpuChosenMove;
	}

	private calculatePlayerMove(playerResults: Result[], cpuCurrentHpPercentage: number): MoveResult {
		let damageResults = getDamageRanges(playerResults);
		let movesToConsider = damageResults.map<MoveConsideration>(r => {
			const kos = r.lowestRollDamage >= r.defender.curHP() && (!savedFromKO(r.defender) || r.move.hits > 1);
			return {
				result: r,
				lowestRollHpPercentage: r.lowestRollHpPercentage,
				kos: kos,
				kosThroughRequiredLifesaver: kos && savedFromKO(r.defender)
			};
		});

		let playerChosenMove!: MoveConsideration;
		for (let potentialMove of movesToConsider) {
			if (!playerChosenMove) {
				playerChosenMove = potentialMove;
				continue;
			}
			const moreDamage = potentialMove.lowestRollHpPercentage > playerChosenMove.lowestRollHpPercentage;
			const kosWithHigherPriority = potentialMove.kos && playerChosenMove.kos && potentialMove.result.move.priority > playerChosenMove.result.move.priority;
			if ((potentialMove.kos && !playerChosenMove.kos) || kosWithHigherPriority) {
				playerChosenMove = potentialMove;
				continue;
			}
			
			if (!playerChosenMove.kos && 
				potentialMove.result.lowestRollDamage > playerChosenMove.result.lowestRollDamage)
				playerChosenMove = potentialMove;

		}

		return playerChosenMove.result;
	}

	private static moveKillsUser(user: Pokemon, moveResult: MoveResult): boolean {
		return !!(moveResult.move.recoil && user.curHP() - moveResult.move.recoil[0] <= 0);
	}

	private static resolveTurnOrder(playerMove: MoveResult, cpuMove: MoveResult): MoveResult {
		if (playerMove.attacker.stats.spe > cpuMove.attacker.stats.spe && playerMove.move.priority >= cpuMove.move.priority)
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

type MoveConsideration = {
	result: MoveResult;
	kos: boolean;
	kosThroughRequiredLifesaver: boolean;
	lowestRollHpPercentage: number;
}

function mergeBoosts(base: StatsTable, delta: StatsTable) : StatsTable {
	return {
		atk: (base.atk || 0) + delta.atk,
		def: (base.def || 0) + delta.def,
		hp: (base.hp || 0) + delta.hp,
		spa: (base.atk || 0) + delta.spa,
		spd: (base.atk || 0) + delta.spd,
		spe: (base.atk || 0) + delta.spe,
	};
}

function getBoosts(moveResult: MoveResult): { attacker: StatsTable, defender: StatsTable } {
	let attackerBoosts: StatsTable = { atk: 0, def: 0, hp: 0, spa: 0, spd: 0, spe: 0 };
	let defenderBoosts: StatsTable = { atk: 0, def: 0, hp: 0, spa: 0, spd: 0, spe: 0 };

	// TODO: Account for items like white herb
	switch(moveResult.move.name) {
		case 'Bulldoze':
		case 'Icy Wind':
		case 'Mud Shot':
		case 'Rock Tomb':
			if (!moveResult.defender.hasItem('White Herb'))
				defenderBoosts.spe--;
			break;
		case 'Close Combat': 
			if (!moveResult.attacker.hasItem('White Herb'))
				attackerBoosts.def--;
			attackerBoosts.spd--;
			break;
		// +1 speed
		case 'Flame Charge':
		case 'Rapid Spin':
			attackerBoosts.spd++;
			break;
		case 'Superpower':
			if (!moveResult.attacker.hasItem('White Herb'))
				attackerBoosts.atk--;
			attackerBoosts.def--;
			break;
		case 'Dragon Dance':
			attackerBoosts.atk++;
			attackerBoosts.spd++;
			break;
		case 'Swords Dance':
			attackerBoosts.atk += 2;
			break;
	}

	return {
		attacker: attackerBoosts,
		defender: defenderBoosts
	};
}
function consumesAttackerItem(attacker: Pokemon, move: Move): boolean {
	if (!attacker.item) return false;

	if (attacker.item.endsWith(' Gem'))
		return true;
	
	return false;
}

function consumesDefenderItem(defender: Pokemon, move: Move): boolean {
	if (!defender.item) return false;

	switch (defender.item) {
		case 'Focus Sash':
			return move.category !== 'Status';
	}

	if (move.name === 'Knock Off' && !defender.hasAbility('Sticky Hold'))
		return true;

	return false;
}

function savedFromKO(pokemon: Pokemon): boolean {
	return hasLifeSavingAbility(pokemon) || hasLifeSavingItem(pokemon);
}

function hasLifeSavingItem(pokemon: Pokemon): boolean {
	return pokemon.hasItem('Focus Sash') && pokemon.curHP() === pokemon.maxHP();
}

function hasLifeSavingAbility(pokemon: Pokemon): boolean {
	return pokemon.hasAbility('Sturdy') && pokemon.curHP() === pokemon.maxHP();
}

function isDefenderItemConsumed(moveResult: MoveResult): boolean {
	return moveResult.highestRollDamage >= moveResult.defender.curHP() && hasLifeSavingItem(moveResult.defender);
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