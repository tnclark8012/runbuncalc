import { Generations, Result } from "@smogon/calc";
import { MoveScore } from "../../moveScore";
import { calculateAllMoves, findHighestDamageMove, getDamageRanges, moveKillsAttacker, moveWillFail, savedFromKO } from "../../moveScoring";
import { ActivePokemon, BattleFieldState, PlayerMoveConsideration } from "../../moveScoring.contracts";
import { PossibleAction, ScoredPossibleAction, TargetSlot } from "./move-selection.contracts";
import { gen, Heuristics } from "../../../configuration";

export function getPlayerPossibleActions(state: BattleFieldState, playerPokemon: ActivePokemon, cpuActive: ActivePokemon[]): PossibleAction[] {
    let actions: PossibleAction[] = [];
    for (let targetSlot = 0; targetSlot < cpuActive.length; targetSlot++) {
        let target = cpuActive[targetSlot];
        let actionsAgainstTarget = getPlayerPossibleActionsAgainstTarget(state, playerPokemon, target, { type: 'opponent', slot: targetSlot });
        actions.push(...actionsAgainstTarget);
    }

    return actions;
}

function getPlayerPossibleActionsAgainstTarget(state: BattleFieldState, playerPokemon: ActivePokemon, target: ActivePokemon, targetSlot: TargetSlot): Array<ScoredPossibleAction> {
    let scores = getMoveScoresAgainstTarget(state, playerPokemon, target, targetSlot)
    .filter(ms => ms.finalScore > 0);

    return scores.map<ScoredPossibleAction>((score: MoveScore) => {
        return ({
            move: { move: score.move.move, target: targetSlot },
            pokemon: playerPokemon.pokemon,
            
            // action: { type: 'move', move: { move: score.move.move, target: targetSlot } }, // TODO - status, protect, etc target self?
            probability: 1/scores.length,
            score: score.finalScore,
            type: 'move',
        });
    });
}

export function getMoveScoresAgainstTarget(state: BattleFieldState, playerPokemon: ActivePokemon, targetCpuPokemon: ActivePokemon, targetSlot: TargetSlot): Array<MoveScore> {
    let playerDamageResults = calculateAllMoves(gen, playerPokemon.pokemon, targetCpuPokemon.pokemon, state.playerField);
    let cpuDamageResults = calculateAllMoves(gen, playerPokemon.pokemon, targetCpuPokemon.pokemon, state.cpuField);
    let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
    let movesToConsider = getPlayerMoveConsiderations(playerDamageResults);

    let scores: MoveScore[] = Heuristics.playerMoveScoringStrategy.scoreMoves(movesToConsider);
    return scores;
}


function getPlayerMoveConsiderations(playerResults: Result[]): PlayerMoveConsideration[] {
    let damageResults = getDamageRanges(playerResults);
	return damageResults
			.map<PlayerMoveConsideration>(r => {
				const kos = r.lowestRollDamage >= r.defender.curHP() && (!savedFromKO(r.defender) || r.move.hits > 1);
				return {
					aiMon: r.defender,
					playerMon: r.attacker,
					result: r,
					lowestRollHpPercentage: r.lowestRollHpPercentage,
					hightestRollHpPercentage: r.highestRollHpPercentage,
					kos: kos,
					kosThroughRequiredLifesaver: kos && savedFromKO(r.defender),
					attackerDiesToRecoil: !!(r.move.recoil && r.attacker.curHP() <= r.move.recoil[0]),
					guaranteedToFail: false
				};
        });

}