import { Field, I, StatsTable, Move, Result, Pokemon, calculate, MEGA_STONES } from '@smogon/calc';
import { MoveScore } from './moveScore';
import { BattleFieldState, MoveResult, PlayerMoveConsideration, PokemonPosition, TurnOutcome } from './moveScoring.contracts';
import { canUseDamagingMoves, createMove, findHighestDamageMove, getDamageRanges, hasLifeSavingItem, savedFromKO, scoreCPUMoves } from './moveScoring';

export interface MatchupResult {
	
}

export interface BattleResult {
	winner: Pokemon;
	turnOutcomes: TurnOutcome[];
}

export interface SimulationOptions {
	maxTurns?: number;
	playerSwitchingIn?: boolean;
}

interface ResolvedOptions extends SimulationOptions {
	maxTurns: number;
}

export class BattleSimulator {
	private readonly originalState: BattleFieldState;
	private currentTurnState!: BattleFieldState;
	private readonly turns: TurnOutcome[] = [];

	constructor(private readonly gen: I.Generation,
		playerPokemon: Pokemon, 
		cpuPokemon: Pokemon,
		playerField: Field, 
		cpuField: Field
	) {
		this.originalState = new BattleFieldState(
			 { pokemon: playerPokemon.clone(), firstTurnOut: true },
			 { pokemon: cpuPokemon.clone(), firstTurnOut: true },
			 playerField.clone(),
			 cpuField.clone()
		);
	}

	private get lastTurn(): TurnOutcome {
		return this.turns[this.turns.length - 1];
	}

	public getResult(options?: SimulationOptions): BattleResult {
		const resolvedOptions: ResolvedOptions = {
			maxTurns: 50,
			...options,
		};

		this.currentTurnState = this.originalState.clone();
		do {
			let turnOutcome = this.simulateTurn(resolvedOptions.playerSwitchingIn);
			this.turns.push(turnOutcome);
			this.currentTurnState = turnOutcome.endOfTurnState.clone();
			// Apply post-turn switches, field effect noticing etc.
			resolvedOptions.playerSwitchingIn = false;
		} while(this.turns.length < resolvedOptions.maxTurns && this.currentTurnState.playerSide.pokemon.curHP() > 0 && this.currentTurnState.cpuSide.pokemon.curHP() > 0 &&
			(canUseDamagingMoves(this.currentTurnState.cpuSide.pokemon) || canUseDamagingMoves(this.currentTurnState.playerSide.pokemon)))
		
		
		let outcome = this.lastTurn;
		let battleState = outcome.endOfTurnState;
		let firstMover = outcome.actions[0].attacker;

		return {
			turnOutcomes: this.turns,
			winner: outcome.endOfTurnState.cpuSide.pokemon.curHP() > outcome.endOfTurnState.playerSide.pokemon.curHP() || 
			(firstMover === battleState.cpuSide.pokemon && battleState.cpuSide.pokemon.curHP() == 0 && battleState.playerSide.pokemon.curHP() == 0) ? battleState.cpuSide.pokemon : battleState.playerSide.pokemon
		}
	}

	private simulateTurn(playerSwitchingIn?: boolean): TurnOutcome  {
		applyStartOfTurnEffects(this.currentTurnState);
		let playerDamageResults = calculateAllMoves(this.gen, this.currentTurnState.playerSide.pokemon, this.currentTurnState.cpuSide.pokemon, this.currentTurnState.playerField);
		let cpuDamageResults = calculateAllMoves(this.gen, this.currentTurnState.cpuSide.pokemon, this.currentTurnState.playerSide.pokemon, this.currentTurnState.cpuField);
		let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
		let cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove).move;
		
		// Not currently accounting for the fact that the player can predict the CPU
		let naivePlayerMoveBasedOnStartingTurnState = this.calculatePlayerMove(playerDamageResults);

		let firstMove = BattleSimulator.resolveTurnOrder(naivePlayerMoveBasedOnStartingTurnState, cpuMove);
		let actions: MoveResult[] = [];
		let playerPokemon = this.currentTurnState.playerSide;
		let cpuPokemon = this.currentTurnState.cpuSide;
		
		const moveCPU = () => {
			if (cpuPokemon.pokemon.curHP() > 0) {
				actions.push(cpuMove);
				let moveResult = applymove(this.gen, cpuPokemon.pokemon, playerPokemon.pokemon, cpuMove);
				cpuPokemon.pokemon = moveResult.attacker;
				playerPokemon.pokemon = moveResult.defender;
			}
		};

		const movePlayer = (move: MoveResult) => {
			if (playerPokemon.pokemon.curHP() > 0) {
				actions.push(move);
				let moveResult = applymove(this.gen, playerPokemon.pokemon, cpuPokemon.pokemon, move);
				playerPokemon.pokemon = moveResult.attacker;
				cpuPokemon.pokemon = moveResult.defender;
			}
		}

		if (playerSwitchingIn) {
			moveCPU();
		}
		else if (firstMove === naivePlayerMoveBasedOnStartingTurnState) {
			movePlayer(naivePlayerMoveBasedOnStartingTurnState);
			moveCPU();
		}
		else {
			moveCPU();
			// If the player moves second, the result of CPU actions could change what would be best for us.
			playerDamageResults = calculateAllMoves(this.gen, playerPokemon.pokemon, cpuPokemon.pokemon, this.currentTurnState.playerField);
			const bestPlayerMove = this.calculatePlayerMove(playerDamageResults);
			let playerMove = bestPlayerMove.move.priority <= naivePlayerMoveBasedOnStartingTurnState.move.priority ? bestPlayerMove : naivePlayerMoveBasedOnStartingTurnState;
			movePlayer(playerMove);
		}

		applyEndOfTurnEffects(playerPokemon.pokemon);
		applyEndOfTurnEffects(cpuPokemon.pokemon);

		return {
			actions,
			turnNumber: this.turns.length,
			endOfTurnState: new BattleFieldState(
				{ pokemon: playerPokemon.pokemon.clone() },
				{ pokemon: cpuPokemon.pokemon.clone() },
				this.currentTurnState.playerField.clone(),
				this.currentTurnState.cpuField.clone(),
			)
		};
	}

	private calculateCpuMove(cpuResults: Result[], playerMove: MoveResult) {
		let moveScores = scoreCPUMoves(cpuResults, playerMove, this.currentTurnState.cpuField, this.lastTurn);
		
		let highestScoringMoves: MoveScore[] = [];
		for (let score of moveScores) {
			let soFar = highestScoringMoves[highestScoringMoves.length - 1];
			if (!soFar) {
				highestScoringMoves.push(score);
				continue;
			}

			if (score.finalScore > soFar.finalScore) {
				highestScoringMoves = [score];
			}
			else if (score.finalScore === soFar.finalScore) {
				highestScoringMoves.push(score);
			}
		}

		return highestScoringMoves[0];
	}

	private calculatePlayerMove(playerResults: Result[]): MoveResult {
		
		let damageResults = getDamageRanges(playerResults);
		let movesToConsider = damageResults
			.map<PlayerMoveConsideration>(r => {
				const kos = r.lowestRollDamage >= r.defender.curHP() && (!savedFromKO(r.defender) || r.move.hits > 1);
				return {
					aiMon: r.defender,
					playerMon: r.attacker,
					result: r,
					lowestRollHpPercentage: r.lowestRollHpPercentage,
					hightestRollHpPercentage: r.highestRollHpPercentage,
					kos: kos,
					kosThroughRequiredLifesaver: kos && savedFromKO(r.defender)
				};
			})
			.filter(m => !BattleSimulator.moveKillsAttacker(m.result));

		let playerChosenMove!: PlayerMoveConsideration;
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
			
			if (!playerChosenMove.kos && moreDamage)
				playerChosenMove = potentialMove;

		}

		return playerChosenMove.result;
	}

	private static moveKillsAttacker(moveResult: MoveResult): boolean {
		return !!(moveResult.move.recoil && moveResult.attacker.curHP() <= moveResult.move.recoil[0]);
	}

	private static resolveTurnOrder(playerMove: MoveResult, cpuMove: MoveResult): MoveResult {
		const playerPriority = playerMove.move.priority,
			cpuPriority = cpuMove.move.priority,
			playerSpeed = playerMove.attacker.stats.spe,
			cpuSpeed = cpuMove.attacker.stats.spe;
		
		if (playerPriority == cpuPriority)
			return playerSpeed > cpuSpeed ? playerMove : cpuMove;

		if (playerPriority > cpuPriority)
			return playerMove;

		return cpuMove;
	}
}

function applyEndOfTurnEffects(pokemon: Pokemon): void {
	if (!pokemon.curHP())
		return;

	switch (pokemon.ability) {
		case 'Speed Boost':
			pokemon.boosts.spe++;
		break;
	}
}

function applyStartOfTurnEffects(battleField: BattleFieldState): void {
	let playerMons = [battleField.playerSide];
	let cpuMons = [battleField.cpuSide];
	
	// TODO: Apply in speed order
	for (let playerMon of playerMons) {
		for (let cpuMon of cpuMons) {
			applyAbilityToOpponent(playerMon, cpuMon);
			applyAbilityToOpponent(cpuMon, playerMon);
		}
	}
}

function applyAbilityToOpponent(attacker: PokemonPosition, opponent: PokemonPosition): void {
	if (attacker.pokemon.hasAbility('Intimidate') && 
		attacker.firstTurnOut &&
		attacker.pokemon.abilityOn &&
		!opponent.pokemon.hasAbility('Clear Body')) {
		attacker.pokemon.abilityOn = false;
		applyBoost(opponent.pokemon.boosts, 'atk', -1);
	}
}

function applymove(gen: I.Generation, attacker: Pokemon, defender: Pokemon, moveResult: MoveResult): { attacker: Pokemon, defender: Pokemon } {
	let boosts = getBoosts(attacker, defender, moveResult.move);
	const attackerLostItem = consumesAttackerItem(attacker, moveResult.move);
	const defenderLostItem = consumesDefenderItem(defender, moveResult.move);

	attacker = attacker.clone({ 
		boosts: boosts.attacker,
		item: !attackerLostItem ? attacker.item: undefined,
		abilityOn: attacker.abilityOn || (attackerLostItem && attacker.hasAbility('Unburden'))
	});

	if (attacker.hasAbility('Libero') || attacker.hasAbility('Protean'))
		attacker.types = [moveResult.move.type];

	defender = defender.clone({ 
		curHP: Math.max(0, defender.curHP() - moveResult.lowestRollDamage, hasLifeSavingItem(defender) && defenderLostItem && moveResult.move.hits < 2 ? 1 : 0),
		item: !defenderLostItem ? defender.item: undefined,
		boosts: boosts.defender,
		abilityOn: defender.abilityOn || (defenderLostItem && defender.hasAbility('Unburden'))
	});

	return { attacker, defender };
}

function applyBoost(stats: StatsTable, kind: keyof StatsTable, modifier: number): void {
	stats[kind] = Math.min(Math.max(-6, stats[kind] + modifier), 6);
}

function getBoosts(attacker: Pokemon, defender: Pokemon, move: Move): { attacker: StatsTable, defender: StatsTable } {
	let attackerBoosts: StatsTable = { ...attacker.boosts };
	let defenderBoosts: StatsTable = { ...defender.boosts };

	const modifyStat = (stats: StatsTable, kind: keyof StatsTable, modifier: number) => {
		if (defender.hasAbility('Clear Body'))
			return;

		applyBoost(stats, kind, modifier);
	};

	switch(move.name) {
		case 'Bulldoze':
		case 'Icy Wind':
		case 'Mud Shot':
		case 'Rock Tomb':
			modifyStat(defenderBoosts, 'spe', -1);
			break;
		case 'Close Combat': 
			modifyStat(attackerBoosts, 'def', -1);
			modifyStat(attackerBoosts, 'spd', -1);
			break;
		// +1 speed
		case 'Flame Charge':
		case 'Rapid Spin':
			modifyStat(attackerBoosts, 'spd', 1);
			break;
		case 'Superpower':
			modifyStat(attackerBoosts, 'atk', -1);
			modifyStat(attackerBoosts, 'def', -1);
			break;
		case 'Dragon Dance':
			modifyStat(attackerBoosts, 'atk', 1);
			modifyStat(attackerBoosts, 'spe', 1);
			break;
		case 'Swords Dance':
			modifyStat(attackerBoosts, 'atk', 2);
			break;
	}

	const checkWhiteHerb = (pokemon: Pokemon, boosts: StatsTable) => { 
		if (!pokemon.hasItem('White Herb'))
			return;

		for (let [name, value] of Object.entries(boosts)) {
			if (value < 0) {
				(boosts as any)[name] = 0;
				pokemon.item = undefined;
			}
		}
	};

	checkWhiteHerb(attacker, attackerBoosts);
	checkWhiteHerb(defender, defenderBoosts);

	return {
		attacker: attackerBoosts,
		defender: defenderBoosts
	};
}

function consumesAttackerItem(attacker: Pokemon, move: Move): boolean {
	if (!attacker.item) return false;

	if (attacker.item.endsWith(' Gem')) {
		let gemType = attacker.item.substring(0, attacker.item.length - ' Gem'.length);
		return move.type === gemType;
	}

	return move.name === 'Fling';
}

function consumesDefenderItem(defender: Pokemon, move: Move): boolean {
	if (!defender.item) return false;

	switch (defender.item) {
		case 'Focus Sash':
		case 'Red Card':
			return move.category !== 'Status';
	}

	if (move.name === 'Knock Off' && !defender.hasAbility('Sticky Hold') && !(defender.item in MEGA_STONES))
		return true;

	return false;
}

function calculateAllMoves(gen: I.Generation, attacker: Pokemon, defender: Pokemon, attackerField: Field): Result[] {
	var results = [];
	for (var i = 0; i < 4; i++) {
		results[i] = calculate(gen, attacker, defender, createMove(attacker, attacker.moves[i]), attackerField);
	}
	return results;
}