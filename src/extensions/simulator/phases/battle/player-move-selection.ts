import { Generations, Pokemon, Result } from "@smogon/calc";
import { MoveScore } from "../../moveScore";
import { calculateAllMoves, canMegaEvolve, findHighestDamageMove, getDamageRanges, megaEvolve, moveKillsAttacker, moveWillFail, savedFromKO } from "../../moveScoring";
import { ActivePokemon, BattleFieldState, PlayerMoveConsideration } from "../../moveScoring.contracts";
import { PossibleAction, ScoredPossibleAction, TargetSlot } from "./move-selection.contracts";
import { gen, Heuristics } from "../../../configuration";

export function getPlayerPossibleActions(state: BattleFieldState, playerPokemon: ActivePokemon): PossibleAction[] {
    let actions: PossibleAction[] = [];
    for (let targetSlot = 0; targetSlot < state.cpu.active.length; targetSlot++) {
        let target = state.cpu.active[targetSlot];
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
            pokemon: score.move.attacker,
            probability: 1,
            score: score.finalScore,
            type: 'move',
        });
    });
}

export function getMoveScoresAgainstTarget(state: BattleFieldState, playerPokemon: ActivePokemon, targetCpuPokemon: ActivePokemon, targetSlot: TargetSlot): Array<MoveScore> {
    let getConsideredMoves = (pokemon: Pokemon): PlayerMoveConsideration[] => {
        let playerDamageResults = calculateAllMoves(gen, pokemon, targetCpuPokemon.pokemon, state.playerField);
        let cpuDamageResults = calculateAllMoves(gen, pokemon, targetCpuPokemon.pokemon, state.cpuField);
        let cpuAssumedPlayerMove = findHighestDamageMove(getDamageRanges(playerDamageResults));
        return getPlayerMoveConsiderations(playerDamageResults);
    };
    
    let movesToConsider = getConsideredMoves(playerPokemon.pokemon);
    if (canMegaEvolve(playerPokemon.pokemon)) {
        let megaEvolved = megaEvolve(playerPokemon.pokemon);
        movesToConsider.push(...getConsideredMoves(megaEvolved));
    }

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