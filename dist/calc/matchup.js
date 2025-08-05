"use strict";
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
exports.__esModule = true;

var move_1 = require("./move");
var pokemon_1 = require("./pokemon");
var calc_1 = require("./calc");
var BattleSimulator = (function () {
    function BattleSimulator(gen, playerPokemon, cpuPokemon, playerField, cpuField) {
        this.gen = gen;
        this.playerPokemon = playerPokemon;
        this.cpuPokemon = cpuPokemon;
        this.playerField = playerField;
        this.cpuField = cpuField;
        this.originalState = {
            playerPokemon: playerPokemon.clone(),
            cpuPokemon: cpuPokemon.clone(),
            playerField: playerField.clone(),
            cpuField: cpuField.clone()
        };
    }
    BattleSimulator.prototype.getResult = function () {
        var outcome = this.simulateTurn();
        var battleState = outcome.battleState;
        var firstMover = outcome.actions[0].attacker;
        return {
            turnOutcomes: [outcome],
            winner: outcome.battleState.cpuPokemon.curHP() > outcome.battleState.playerPokemon.curHP() ||
                (firstMover === battleState.cpuPokemon && battleState.cpuPokemon.curHP() == 0 && battleState.playerPokemon.curHP() == 0) ? battleState.cpuPokemon : battleState.playerPokemon
        };
    };
    BattleSimulator.prototype.simulateTurn = function () {
        var firstMover = this.cpuPokemon.stats.spe >= this.playerPokemon.stats.spe ? this.cpuPokemon : this.playerPokemon;
        var playerDamageResults = calculateAllMoves(this.gen, this.playerPokemon, this.cpuPokemon, this.playerField);
        var cpuDamageResults = calculateAllMoves(this.gen, this.cpuPokemon, this.playerPokemon, this.cpuField);
        var cpuAssumedPlayerMove = BattleSimulator.findHighestDamageMove(getDamageRanges(playerDamageResults));
        var playerMove = this.calculatePlayerMove(playerDamageResults, this.cpuPokemon.curHP() / this.cpuPokemon.maxHP());
        var cpuMove = this.calculateCpuMove(cpuDamageResults, cpuAssumedPlayerMove);
        var firstMove = BattleSimulator.resolveTurnOrder(playerMove, cpuMove);
        var actions = [];
        var playerPokemon = this.playerPokemon;
        var cpuPokmeon = this.cpuPokemon;
        if (firstMove === playerMove) {
            actions.push(playerMove);
            cpuPokmeon = new pokemon_1.Pokemon(this.gen, this.cpuPokemon.name, { curHP: Math.max(0, this.cpuPokemon.curHP() - playerMove.lowestRollDamage) });
            if (cpuPokmeon.curHP() >= 0) {
                actions.push(cpuMove);
                playerPokemon = new pokemon_1.Pokemon(this.gen, this.playerPokemon.name, { curHP: Math.max(0, this.playerPokemon.curHP() - cpuMove.highestRollDamage) });
            }
        }
        else {
            actions.push(cpuMove);
            playerPokemon = new pokemon_1.Pokemon(this.gen, this.playerPokemon.name, { curHP: Math.max(this.playerPokemon.curHP() - cpuMove.highestRollDamage) });
            if (playerPokemon.curHP() >= 0) {
                actions.push(playerMove);
                cpuPokmeon = new pokemon_1.Pokemon(this.gen, this.cpuPokemon.name, { curHP: Math.max(this.cpuPokemon.curHP() - playerMove.lowestRollDamage) });
            }
        }
        return {
            actions: actions,
            battleState: {
                cpuField: this.cpuField.clone(),
                playerField: this.playerField.clone(),
                cpuPokemon: cpuPokmeon.clone(),
                playerPokemon: playerPokemon.clone()
            }
        };
    };
    BattleSimulator.prototype.calculateCpuMove = function (cpuResults, playerMove) {
        var highestDamageResult = cpuResults[0];
        var damageResults = getDamageRanges(cpuResults);
        var maxDamageMove = BattleSimulator.findHighestDamageMove(damageResults);
        var cpuChosenMove = maxDamageMove;
        var playerKOsCpu = playerMove.highestRollHpPercentage >= this.cpuPokemon.curHP() / this.cpuPokemon.maxHP();
        var playerOutspeeds = this.playerPokemon.stats.spe > this.cpuPokemon.stats.spe;
        if (playerKOsCpu && playerOutspeeds) {
            var bestPriorityMove = BattleSimulator.findHighestDamageMove(damageResults.filter(function (result) { return result.move.priority > 0; }));
            if (bestPriorityMove)
                cpuChosenMove = bestPriorityMove;
        }
        return cpuChosenMove;
    };
    BattleSimulator.prototype.calculatePlayerMove = function (playerResults, cpuCurrentHpPercentage) {
        var e_1, _a;
        var highestDamageResult = playerResults[0];
        var damageResults = getDamageRanges(playerResults);
        var playerChosenMove = damageResults[0];
        try {
            for (var damageResults_1 = __values(damageResults), damageResults_1_1 = damageResults_1.next(); !damageResults_1_1.done; damageResults_1_1 = damageResults_1.next()) {
                var result = damageResults_1_1.value;
                if (result.highestRollHpPercentage > playerChosenMove.highestRollHpPercentage ||
                    ((playerChosenMove.highestRollHpPercentage >= cpuCurrentHpPercentage && result.highestRollHpPercentage >= cpuCurrentHpPercentage) &&
                        result.move.priority > playerChosenMove.move.priority))
                    playerChosenMove = result;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (damageResults_1_1 && !damageResults_1_1.done && (_a = damageResults_1["return"])) _a.call(damageResults_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return playerChosenMove;
    };
    BattleSimulator.moveKillsUser = function (user, moveResult) {
        return !!(moveResult.move.recoil && user.curHP() - moveResult.move.recoil[0] <= 0);
    };
    BattleSimulator.resolveTurnOrder = function (playerMove, cpuMove) {
        if (playerMove.attacker.stats.spe > cpuMove.attacker.stats.spe || playerMove.move.priority > cpuMove.move.priority)
            return playerMove;
        return cpuMove;
    };
    BattleSimulator.findHighestDamageMove = function (moveResults) {
        var e_2, _a;
        var maxDamageMove = moveResults[0];
        try {
            for (var moveResults_1 = __values(moveResults), moveResults_1_1 = moveResults_1.next(); !moveResults_1_1.done; moveResults_1_1 = moveResults_1.next()) {
                var result = moveResults_1_1.value;
                if (result.highestRollHpPercentage > maxDamageMove.highestRollHpPercentage)
                    maxDamageMove = result;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (moveResults_1_1 && !moveResults_1_1.done && (_a = moveResults_1["return"])) _a.call(moveResults_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return maxDamageMove;
    };
    return BattleSimulator;
}());
exports.BattleSimulator = BattleSimulator;
function simulateTurn(gen, playerPokemon, cpuPokemon, playerField, cpuField) {
    var firstMover = cpuPokemon.stats.spe >= playerPokemon.stats.spe ? cpuPokemon : playerPokemon;
    var playerDamageResults = calculateAllMoves(gen, playerPokemon, cpuPokemon, playerField);
    var cpuDamageResults = calculateAllMoves(gen, cpuPokemon, playerPokemon, cpuField);
}
function calculateAllMoves(gen, attacker, defender, attackerField) {
    var results = [];
    for (var i = 0; i < 4; i++) {
        results[i] = (0, calc_1.calculate)(gen, attacker, defender, new move_1.Move(gen, attacker.moves[i]), attackerField);
    }
    return results;
}
function getDamageRanges(attackerResults, expectedHits) {
    var attacker = attackerResults[0].attacker;
    var defender = attackerResults[0].defender;
    var highestRoll, lowestRoll, damage = 0;
    var p1KO = 0, p2KO = 0;
    var p1HD = 0, p2HD = 0;
    return attackerResults.map(function (result, i) {
        var resultDamage = result.damage;
        var lowestHitDamage = resultDamage[0] ? resultDamage[0] : result.damage;
        var highestHitDamage = result.damage[15] ? resultDamage[15] : result.damage;
        var getDamagePct = function (hitDamage) { return hitDamage * (new move_1.Move(attacker.gen, attacker.moves[i]).hits / defender.stats.hp * 100); };
        return {
            attacker: attacker,
            defender: defender,
            move: result.move,
            lowestRollDamage: lowestHitDamage,
            lowestRollHpPercentage: getDamagePct(lowestHitDamage),
            highestRollDamage: highestHitDamage,
            highestRollHpPercentage: getDamagePct(highestHitDamage)
        };
    });
}
//# sourceMappingURL=matchup.js.map