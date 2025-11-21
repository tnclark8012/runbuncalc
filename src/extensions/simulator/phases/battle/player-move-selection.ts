import { Generations, Pokemon, Result, Move } from "@smogon/calc";
import { MoveScore } from "../../moveScore";
import { calculateAllMoves, canMegaEvolve, findHighestDamageMove, toMoveResults, megaEvolve, savedFromKO, createMove } from "../../moveScoring";
import { BattleFieldState, MoveResult, PlayerMoveConsideration, PokemonPosition } from "../../moveScoring.contracts";
import { PossibleAction, PossibleTrainerAction, ScoredPossibleAction, TargetSlot } from "./move-selection.contracts";
import { gen, Heuristics, playerRng } from "../../../configuration";
import { SwitchAfterKOStrategy } from "../switching/player-switch-in";

const playerSwitchStrategy = new SwitchAfterKOStrategy();

export function getPlayerPossibleActions(state: BattleFieldState): PossibleTrainerAction[][] {
    let possibleActionsByPokemon: PossibleTrainerAction[][] = state.player.active.map<PossibleTrainerAction[]>(() => []);

    // Priotize attacking over switching to avoid unnecessary switches.
    for (let i = 0; i < state.player.active.length; i++) {
        // Check if Pokemon is locked into a charging move
        let lockedMove = getLockedMoveAction(state, i);
        if (lockedMove) {
            possibleActionsByPokemon[i].push(lockedMove);
            continue; // Skip normal move selection for this Pokemon
        }

        // attack
        let possibleActions: PossibleAction[] = getPossibleMovesByPokemon(state, state.player.active[i]);
        possibleActionsByPokemon[i].push(...possibleActions.map<PossibleTrainerAction>(action => ({
            pokemon: state.player.active[i],
            action,
            slot: { slot: i },
            trainer: state.player
        })));
    }

    if (state.field.gameType === 'Singles') {
        let switchActionsByPokemon = playerSwitchStrategy.getPossibleStartOfTurnSwitches(state);
        if (switchActionsByPokemon?.length)
            possibleActionsByPokemon[0].push(...switchActionsByPokemon[0]);
    }

    return possibleActionsByPokemon;
}

function getLockedMoveAction(state: BattleFieldState, playerActiveIndex: number): PossibleTrainerAction | undefined {
    const playerPokemon = state.player.active[playerActiveIndex];
    let volatileStatus = playerPokemon.volatileStatus;
    if (!volatileStatus)
        return;

    if (!volatileStatus.chargingMove)
        return;

    const chargingMove = new Move(gen, volatileStatus.chargingMove);
    return {
        pokemon: playerPokemon,
        action: {
            type: 'move',
            pokemon: playerPokemon.pokemon,
            move: {
                move: chargingMove,
                target: { type: 'opponent', slot: 0 } // Default to first opponent
            },
            probability: 1
        },
        slot: { slot: playerActiveIndex },
        trainer: state.player
    };
}

function getPossibleMovesByPokemon(state: BattleFieldState, playerPokemon: PokemonPosition): PossibleAction[] {
    let actions: PossibleAction[] = [];
    for (let playerSlot = 0; playerSlot < state.player.active.length; playerSlot++) {
        let playerPokemon = state.player.active[playerSlot];
        for (let targetSlot = 0; targetSlot < state.cpu.active.length; targetSlot++) {
            let target = state.cpu.active[targetSlot];
            let actionsAgainstTarget = getPlayerPossibleActionsAgainstTarget(state, playerPokemon, target, { type: 'opponent', slot: targetSlot });
            actions.push(...actionsAgainstTarget);
        }
    }

    return actions;
}

function getPlayerPossibleActionsAgainstTarget(state: BattleFieldState, playerPokemon: PokemonPosition, target: PokemonPosition, targetSlot: TargetSlot): Array<ScoredPossibleAction> {
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

export function getMoveScoresAgainstTarget(state: BattleFieldState, playerPokemon: PokemonPosition, targetCpuPokemon: PokemonPosition, targetSlot: TargetSlot): Array<MoveScore> {
    let getConsideredMoves = (pokemon: Pokemon): PlayerMoveConsideration[] => {
        let playerDamageResults = calculateAllMoves(gen, pokemon, targetCpuPokemon.pokemon, state.playerField);
        let cpuDamageResults = calculateAllMoves(gen, pokemon, targetCpuPokemon.pokemon, state.cpuField);
        let cpuAssumedPlayerMove = findHighestDamageMove(toMoveResults(playerDamageResults));
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
    let getDamagePct = (moveResult: MoveResult, hitDamage: number) => hitDamage * (createMove(moveResult.attacker, moveResult.move).hits / moveResult.defender.stats.hp * 100);
    let damageResults = toMoveResults(playerResults);
    return damageResults
        .map<PlayerMoveConsideration>(r => {
            const kos = r.lowestRollPerHitDamage * playerRng.getHits(r) >= r.defender.curHP() && (!savedFromKO(r.defender) || r.move.hits > 1);
            return {
                aiMon: r.defender,
                playerMon: r.attacker,
                result: r,
                lowestRollTotalHitsHpPercentage: getDamagePct(r, r.lowestRollPerHitDamage),
                highestRollTotalHitsHpPercentage: getDamagePct(r, r.highestRollPerHitDamage),
                kos: kos,
                kosThroughRequiredLifesaver: kos && savedFromKO(r.defender),
                attackerDiesToRecoil: !!(r.move.recoil && r.attacker.curHP() <= r.move.recoil[0]),
                guaranteedToFail: false
            };
        });

}