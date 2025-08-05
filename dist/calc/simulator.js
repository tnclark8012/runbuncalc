"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });

var calc_1 = require("./calc");
var moveScoring_1 = require("./moveScoring");
var items_1 = require("./data/items");
var BattleSimulator = (function () {
    function BattleSimulator(gen, playerPokemon, cpuPokemon, playerField, cpuField) {
        this.gen = gen;
        this.turns = [];
        this.originalState = {
            playerPokemon: playerPokemon.clone(),
            cpuPokemon: cpuPokemon.clone(),
            playerField: playerField.clone(),
            cpuField: cpuField.clone()
        };
    }
    Object.defineProperty(BattleSimulator.prototype, "lastTurn", {
        get: function () {
            return this.turns[this.turns.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    BattleSimulator.prototype.getResult = function (maxTurns) {
        maxTurns = maxTurns || 50;
        this.simulationState = {
            playerPokemon: this.originalState.playerPokemon.clone(),
            cpuPokemon: this.originalState.cpuPokemon.clone(),
            playerField: this.originalState.playerField.clone(),
            cpuField: this.originalState.cpuField.clone()
        };
        do {
            var turnOutcome = this.simulateTurn();
            this.turns.push(turnOutcome);
            this.simulationState = turnOutcome.battleFieldState;
        } while (this.turns.length < maxTurns && this.simulationState.playerPokemon.curHP() > 0 && this.simulationState.cpuPokemon.curHP() > 0 &&
            ((0, moveScoring_1.canUseDamagingMoves)(this.simulationState.cpuPokemon) || (0, moveScoring_1.canUseDamagingMoves)(this.simulationState.playerPokemon)));
        var outcome = this.lastTurn;
        var battleState = outcome.battleFieldState;
        var firstMover = outcome.actions[0].attacker;
        return {
            turnOutcomes: this.turns,
            winner: outcome.battleFieldState.cpuPokemon.curHP() > outcome.battleFieldState.playerPokemon.curHP() ||
                (firstMover === battleState.cpuPokemon && battleState.cpuPokemon.curHP() == 0 && battleState.playerPokemon.curHP() == 0) ? battleState.cpuPokemon : battleState.playerPokemon
        };
    };
    BattleSimulator.prototype.simulateTurn = function () {
        var playerDamageResults = calculateAllMoves(this.gen, this.simulationState.playerPokemon, this.simulationState.cpuPokemon, this.simulationState.playerField);
        var cpuDamageResults = calculateAllMoves(this.gen, this.simulationState.cpuPokemon, this.simulationState.playerPokemon, this.simulationState.cpuField);
        var cpuAssumedPlayerMove = (0, moveScoring_1.findHighestDamageMove)((0, moveScoring_1.getDamageRanges)(playerDamageResults));
        var cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove).move;
        var naivePlayerMoveBasedOnStartingTurnState = this.calculatePlayerMove(playerDamageResults);
        var firstMove = BattleSimulator.resolveTurnOrder(naivePlayerMoveBasedOnStartingTurnState, cpuMove);
        var actions = [];
        var playerPokemon = this.simulationState.playerPokemon;
        var cpuPokemon = this.simulationState.cpuPokemon;
        if (firstMove === naivePlayerMoveBasedOnStartingTurnState) {
            actions.push(naivePlayerMoveBasedOnStartingTurnState);
            var moveResult = applymove(this.gen, playerPokemon, cpuPokemon, naivePlayerMoveBasedOnStartingTurnState);
            playerPokemon = moveResult.attacker;
            cpuPokemon = moveResult.defender;
            if (cpuPokemon.curHP() > 0) {
                actions.push(cpuMove);
                moveResult = applymove(this.gen, cpuPokemon, playerPokemon, cpuMove);
                cpuPokemon = moveResult.attacker;
                playerPokemon = moveResult.defender;
            }
        }
        else {
            actions.push(cpuMove);
            var moveResult = applymove(this.gen, cpuPokemon, playerPokemon, cpuMove);
            cpuPokemon = moveResult.attacker;
            playerPokemon = moveResult.defender;
            if (playerPokemon.curHP() > 0) {
                playerDamageResults = calculateAllMoves(this.gen, playerPokemon, cpuPokemon, this.simulationState.playerField);
                var bestPlayerMove = this.calculatePlayerMove(playerDamageResults);
                var playerMove = bestPlayerMove.move.priority <= naivePlayerMoveBasedOnStartingTurnState.move.priority ? bestPlayerMove : naivePlayerMoveBasedOnStartingTurnState;
                actions.push(playerMove);
                moveResult = applymove(this.gen, playerPokemon, cpuPokemon, playerMove);
                playerPokemon = moveResult.attacker;
                cpuPokemon = moveResult.defender;
            }
        }
        applyEndOfTurnEffects(playerPokemon);
        applyEndOfTurnEffects(cpuPokemon);
        return {
            actions: actions,
            battleFieldState: {
                cpuField: this.simulationState.cpuField.clone(),
                playerField: this.simulationState.playerField.clone(),
                cpuPokemon: cpuPokemon.clone(),
                playerPokemon: playerPokemon.clone()
            }
        };
    };
    BattleSimulator.prototype.calculateCpuMove = function (cpuResults, playerMove) {
        var e_1, _a;
        var moveScores = (0, moveScoring_1.scoreCPUMoves)(cpuResults, playerMove, this.simulationState.cpuField, this.lastTurn);
        var highestScoringMoves = [];
        try {
            for (var moveScores_1 = __values(moveScores), moveScores_1_1 = moveScores_1.next(); !moveScores_1_1.done; moveScores_1_1 = moveScores_1.next()) {
                var score = moveScores_1_1.value;
                var soFar = highestScoringMoves[highestScoringMoves.length - 1];
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
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (moveScores_1_1 && !moveScores_1_1.done && (_a = moveScores_1.return)) _a.call(moveScores_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return highestScoringMoves[0];
    };
    BattleSimulator.prototype.calculatePlayerMove = function (playerResults) {
        var e_2, _a;
        var damageResults = (0, moveScoring_1.getDamageRanges)(playerResults);
        var movesToConsider = damageResults
            .map(function (r) {
            var kos = r.lowestRollDamage >= r.defender.curHP() && (!(0, moveScoring_1.savedFromKO)(r.defender) || r.move.hits > 1);
            return {
                aiMon: r.defender,
                playerMon: r.attacker,
                result: r,
                lowestRollHpPercentage: r.lowestRollHpPercentage,
                hightestRollHpPercentage: r.highestRollHpPercentage,
                kos: kos,
                kosThroughRequiredLifesaver: kos && (0, moveScoring_1.savedFromKO)(r.defender)
            };
        })
            .filter(function (m) { return !BattleSimulator.moveKillsAttacker(m.result); });
        var playerChosenMove;
        try {
            for (var movesToConsider_1 = __values(movesToConsider), movesToConsider_1_1 = movesToConsider_1.next(); !movesToConsider_1_1.done; movesToConsider_1_1 = movesToConsider_1.next()) {
                var potentialMove = movesToConsider_1_1.value;
                if (!playerChosenMove) {
                    playerChosenMove = potentialMove;
                    continue;
                }
                var moreDamage = potentialMove.lowestRollHpPercentage > playerChosenMove.lowestRollHpPercentage;
                var kosWithHigherPriority = potentialMove.kos && playerChosenMove.kos && potentialMove.result.move.priority > playerChosenMove.result.move.priority;
                if ((potentialMove.kos && !playerChosenMove.kos) || kosWithHigherPriority) {
                    playerChosenMove = potentialMove;
                    continue;
                }
                if (!playerChosenMove.kos && moreDamage)
                    playerChosenMove = potentialMove;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (movesToConsider_1_1 && !movesToConsider_1_1.done && (_a = movesToConsider_1.return)) _a.call(movesToConsider_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return playerChosenMove.result;
    };
    BattleSimulator.moveKillsAttacker = function (moveResult) {
        return !!(moveResult.move.recoil && moveResult.attacker.curHP() <= moveResult.move.recoil[0]);
    };
    BattleSimulator.resolveTurnOrder = function (playerMove, cpuMove) {
        var playerPriority = playerMove.move.priority, cpuPriority = cpuMove.move.priority, playerSpeed = playerMove.attacker.stats.spe, cpuSpeed = cpuMove.attacker.stats.spe;
        if (playerPriority == cpuPriority)
            return playerSpeed > cpuSpeed ? playerMove : cpuMove;
        if (playerPriority > cpuPriority)
            return playerMove;
        return cpuMove;
    };
    BattleSimulator.findHighestDamageMove = function (moveResults) {
        var e_3, _a;
        var maxDamageMove = moveResults[0];
        try {
            for (var moveResults_1 = __values(moveResults), moveResults_1_1 = moveResults_1.next(); !moveResults_1_1.done; moveResults_1_1 = moveResults_1.next()) {
                var result = moveResults_1_1.value;
                if (result.highestRollHpPercentage > maxDamageMove.highestRollHpPercentage)
                    maxDamageMove = result;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (moveResults_1_1 && !moveResults_1_1.done && (_a = moveResults_1.return)) _a.call(moveResults_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return maxDamageMove;
    };
    return BattleSimulator;
}());
exports.BattleSimulator = BattleSimulator;
function applyEndOfTurnEffects(pokemon) {
    switch (pokemon.ability) {
        case 'Speed Boost':
            pokemon.boosts.spe++;
            break;
    }
}
function applymove(gen, attacker, defender, moveResult) {
    var boosts = getBoosts(attacker, defender, moveResult.move);
    var attackerLostItem = consumesAttackerItem(attacker, moveResult.move);
    var defenderLostItem = consumesDefenderItem(defender, moveResult.move);
    attacker = attacker.clone({
        boosts: boosts.attacker,
        item: !attackerLostItem ? attacker.item : undefined,
        abilityOn: attacker.abilityOn || (attackerLostItem && attacker.hasAbility('Unburden'))
    });
    if (attacker.hasAbility('Libero') || attacker.hasAbility('Protean'))
        attacker.types = [moveResult.move.type];
    defender = defender.clone({
        curHP: Math.max(0, defender.curHP() - moveResult.lowestRollDamage),
        item: !defenderLostItem ? defender.item : undefined,
        boosts: boosts.defender,
        abilityOn: defender.abilityOn || (defenderLostItem && defender.hasAbility('Unburden'))
    });
    return { attacker: attacker, defender: defender };
}
function mergeBoosts(base, delta) {
    return {
        atk: (base.atk || 0) + delta.atk,
        def: (base.def || 0) + delta.def,
        hp: (base.hp || 0) + delta.hp,
        spa: (base.atk || 0) + delta.spa,
        spd: (base.atk || 0) + delta.spd,
        spe: (base.atk || 0) + delta.spe,
    };
}
function getBoosts(attacker, defender, move) {
    var attackerBoosts = __assign({}, attacker.boosts);
    var defenderBoosts = __assign({}, defender.boosts);
    var modifyStat = function (stats, kind, modifier) {
        if (defender.hasAbility('Clear Body'))
            return;
        if (defender.hasItem('White Herb')) {
            defender.item = undefined;
            return;
        }
        stats[kind] = Math.min(Math.max(-6, stats[kind] + modifier), 6);
    };
    switch (move.name) {
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
    return {
        attacker: attackerBoosts,
        defender: defenderBoosts
    };
}
function consumesAttackerItem(attacker, move) {
    if (!attacker.item)
        return false;
    if (attacker.item.endsWith(' Gem')) {
        var gemType = attacker.item.substring(0, attacker.item.length - ' Gem'.length);
        return move.type === gemType;
    }
    return move.name === 'Fling';
}
function consumesDefenderItem(defender, move) {
    if (!defender.item)
        return false;
    switch (defender.item) {
        case 'Focus Sash':
        case 'Red Card':
            return move.category !== 'Status';
    }
    if (move.name === 'Knock Off' && !defender.hasAbility('Sticky Hold') && !(defender.item in items_1.MEGA_STONES))
        return true;
    return false;
}
function calculateAllMoves(gen, attacker, defender, attackerField) {
    var results = [];
    for (var i = 0; i < 4; i++) {
        results[i] = (0, calc_1.calculate)(gen, attacker, defender, (0, moveScoring_1.createMove)(attacker, attacker.moves[i]), attackerField);
    }
    return results;
}
//# sourceMappingURL=simulator.js.map