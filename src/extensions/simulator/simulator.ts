import { Field, I, StatsTable, Move, Result, Pokemon, MEGA_STONES } from '@smogon/calc';
import { MoveScore } from './moveScore';
import { BattleFieldState, MoveConsideration, MoveResult, PlayerMoveConsideration, ActivePokemon, TurnOutcome, Trainer, PokemonPosition, CpuTrainer, PlayerTrainer } from './moveScoring.contracts';
import { calculateAllMoves, canUseDamagingMoves, createMove, findHighestDamageMove, getDamageRanges, hasLifeSavingItem, moveKillsAttacker, moveWillFail, savedFromKO, scoreCPUMoves } from './moveScoring';
import { applyBoost, getFinalSpeed } from './utils';
import { CpuSwitchStrategy } from './switchStrategy.cpu';
import { PartyOrderSwitchStrategy } from './switchStrategy.partyOrder';
import { getRecovery } from '@smogon/calc/dist/desc';
import { executeMove } from './phases/battle/execute-move';
import { cpuRng, playerRng } from '../configuration';

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
		playerTrainerOrPokemon: Pokemon | Trainer,
		cpuTrainerOrPokemon: Pokemon | Trainer,
		field: Field,
	) {
		let cpuTrainer = !(cpuTrainerOrPokemon instanceof Trainer) ?
			new CpuTrainer([new PokemonPosition(cpuTrainerOrPokemon.clone(), true)], [], new CpuSwitchStrategy()) :
			cpuTrainerOrPokemon;

		let playerTrainer = !(playerTrainerOrPokemon instanceof Trainer) ?
			new PlayerTrainer([new PokemonPosition(playerTrainerOrPokemon.clone(), true)], [], new PartyOrderSwitchStrategy(s => s.player)) :
			playerTrainerOrPokemon;

		this.originalState = new BattleFieldState(
			playerTrainer,
			cpuTrainer,
			field.clone()
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
			this.currentTurnState.turnNumber++;
			this.currentTurnState.player.active[0].firstTurnOut = false;
			this.currentTurnState.cpu.active[0].firstTurnOut = false;

			// Apply post-turn switches, field effect noticing etc.
			resolvedOptions.playerSwitchingIn = false;
		} while(this.turns.length < resolvedOptions.maxTurns && this.currentTurnState.player.active[0].pokemon.curHP() > 0 && this.currentTurnState.cpu.active[0].pokemon.curHP() > 0 &&
			(canUseDamagingMoves(this.currentTurnState.cpu.active[0].pokemon) || canUseDamagingMoves(this.currentTurnState.player.active[0].pokemon)))
		
		
		let outcome = this.lastTurn;
		let battleState = outcome.endOfTurnState;
		let firstMover = outcome.actions[0].attacker;

		return {
			turnOutcomes: this.turns,
			winner: outcome.endOfTurnState.cpu.active[0].pokemon.curHP() > outcome.endOfTurnState.player.active[0].pokemon.curHP() || 
			(firstMover === battleState.cpu.active[0].pokemon && battleState.cpu.active[0].pokemon.curHP() == 0 && battleState.player.active[0].pokemon.curHP() == 0) ? battleState.cpu.active[0].pokemon : battleState.player.active[0].pokemon
		}
	}

	private simulateTurn(playerSwitchingIn?: boolean): TurnOutcome  {
		applyStartOfTurnEffects(this.currentTurnState);
		let playerPokemon = this.currentTurnState.player.active[0];
		let cpuPokemon = this.currentTurnState.cpu.active[0];
		let playerDamageResults = calculateAllMoves(this.gen, playerPokemon.pokemon, cpuPokemon.pokemon, this.currentTurnState.playerField);
		let cpuDamageResults = calculateAllMoves(this.gen, cpuPokemon.pokemon, playerPokemon.pokemon, this.currentTurnState.cpuField);
		let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
		let cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove).move;
		
		// Not currently accounting for the fact that the player can predict the CPU
		let naivePlayerMoveBasedOnStartingTurnState = this.calculatePlayerMove(playerDamageResults);

		let firstMove = BattleSimulator.resolveTurnOrder(naivePlayerMoveBasedOnStartingTurnState, cpuMove, this.currentTurnState);
		let actions: MoveResult[] = [];

		const moveCPU = () => {
			if (cpuPokemon.pokemon.curHP() > 0) {
				actions.push(cpuMove);
				let moveResult = executeMove(cpuPokemon.pokemon, playerPokemon.pokemon, cpuMove.move, this.currentTurnState.cpuField, cpuRng);
				cpuPokemon.pokemon = moveResult.attacker;
				playerPokemon.pokemon = moveResult.defender;
			}
		};

		const movePlayer = (move: MoveResult) => {
			if (playerPokemon.pokemon.curHP() > 0) {
				actions.push(move); 
				let moveResult = executeMove(playerPokemon.pokemon, cpuPokemon.pokemon, move.move, this.currentTurnState.playerField, playerRng);
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
				this.currentTurnState.player.clone(),
				this.currentTurnState.cpu.clone(),
				this.currentTurnState.playerField.clone(),
				this.turns.length
			)
		};
	}

	private calculateCpuMove(cpuResults: Result[], playerMove: MoveResult): MoveScore {
		let aiMon = cpuResults[0].attacker;
		let moveScores = scoreCPUMoves(cpuResults, playerMove, this.currentTurnState);
		
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
				const kos = (r.lowestRollDamage * r.move.hits) >= r.defender.curHP() && (!savedFromKO(r.defender) || r.move.hits > 1);
				return {
					aiMon: r.defender,
					playerMon: r.attacker,
					result: r,
					lowestRollHpPercentage: r.lowestRollHpPercentage,
					hightestRollHpPercentage: r.highestRollHpPercentage,
					kos: kos,
					kosThroughRequiredLifesaver: kos && savedFromKO(r.defender),
					attackerDiesToRecoil: moveKillsAttacker(r),
					guaranteedToFail: false
				};
			})
			.filter(m => !moveKillsAttacker(m.result) && !moveWillFail(this.currentTurnState.player.active[0], m))

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

	private static resolveTurnOrder(playerMove: MoveResult, cpuMove: MoveResult, state: BattleFieldState): MoveResult {
		const playerPriority = playerMove.move.priority,
			cpuPriority = cpuMove.move.priority,
			playerSpeed = getFinalSpeed(playerMove.attacker, state.playerField, state.playerSide),
			cpuSpeed = getFinalSpeed(cpuMove.attacker, state.cpuField, state.cpuSide);
		
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
	let playerMons = [battleField.player];
	let cpuMons = [battleField.cpu];
	
	// TODO: Apply in speed order
	for (let playerMon of playerMons) {
		for (let cpuMon of cpuMons) {
			applyAbilityToOpponent(playerMon.active[0], cpuMon.active[0]);
			applyAbilityToOpponent(cpuMon.active[0], playerMon.active[0]);
		}
	}
}

function applyAbilityToOpponent(attacker: ActivePokemon, opponent: ActivePokemon): void {
	if (attacker.pokemon.hasAbility('Intimidate') && 
		attacker.firstTurnOut &&
		!opponent.pokemon.hasAbility('Clear Body')) {
		attacker.pokemon.abilityOn = false;
		applyBoost(opponent.pokemon.boosts, 'atk', -1);
	}
}