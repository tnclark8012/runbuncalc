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
Object.defineProperty(exports, "__esModule", { value: true });

var move_1 = require("./move");
var moveScore_1 = require("./moveScore");
var notImplementedError_1 = require("./notImplementedError");
function scoreCPUMoves(cpuResults, playerMove, field, lastTurnOutcome) {
    var e_1, _a;
    var highestDamageResult = cpuResults[0];
    var damageResults = getDamageRanges(cpuResults);
    var maxDamageMove = findHighestDamageMove(damageResults);
    var cpuChosenMove = maxDamageMove;
    var aiMon = maxDamageMove.attacker;
    var playerMon = maxDamageMove.defender;
    var aiIsFaster = aiMon.stats.spe >= playerMon.stats.spe;
    var movesToConsider = damageResults.map(function (r) {
        var kos = r.lowestRollDamage >= r.defender.curHP();
        var aiActionLastTurn = lastTurnOutcome === null || lastTurnOutcome === void 0 ? void 0 : lastTurnOutcome.actions.find(function (a) { return a.attacker.equals(aiMon); });
        return {
            result: r,
            lowestRollHpPercentage: r.lowestRollHpPercentage,
            hightestRollHpPercentage: r.highestRollHpPercentage,
            kos: kos,
            isDamagingMove: r.move.category !== 'Status',
            isHighestDamagingMove: maxDamageMove === r,
            aiIsFaster: aiIsFaster,
            aiIsSlower: !aiIsFaster,
            playerMon: playerMon,
            aiMon: aiMon,
            playerMove: playerMove,
            playerWillKOAI: playerMove.highestRollDamage >= aiMon.curHP() && !savedFromKO(aiMon),
            playerWill2HKOAI: playerMove.highestRollDamage * 2 >= aiMon.curHP(),
            aiMonFirstTurnOut: !lastTurnOutcome || !lastTurnOutcome.battleFieldState.cpuPokemon.equals(aiMon),
            lastTurnCPUMove: aiActionLastTurn ? aiActionLastTurn.move : undefined,
            field: field
        };
    });
    var moveScores = [];
    try {
        for (var movesToConsider_1 = __values(movesToConsider), movesToConsider_1_1 = movesToConsider_1.next(); !movesToConsider_1_1.done; movesToConsider_1_1 = movesToConsider_1.next()) {
            var potentialMove = movesToConsider_1_1.value;
            var moveScore = new moveScore_1.MoveScore(potentialMove.result);
            if (potentialMove.isDamagingMove) {
                allDamagingMoves(moveScore, potentialMove);
                damagingPriorityMoves(moveScore, potentialMove);
                damagingTrappingMoves(moveScore);
                damagingSpeedReductionMoves(moveScore, potentialMove);
                damagingAttackSpAttackReductionWithGuarnateedEffect(moveScore, potentialMove);
                damagingMinus2SpDefReductionWithGuaranteedEffect(moveScore);
            }
            specificMoves(moveScore, potentialMove);
            generalSetup(moveScore, potentialMove);
            offensiveSetup(moveScore, potentialMove);
            defensiveSetup(moveScore, potentialMove);
            moveScores.push(moveScore);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (movesToConsider_1_1 && !movesToConsider_1_1.done && (_a = movesToConsider_1.return)) _a.call(movesToConsider_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return moveScores;
}
exports.scoreCPUMoves = scoreCPUMoves;
function damagingAttackSpAttackReductionWithGuarnateedEffect(moveScore, considerations) {
    if (!considerations.isHighestDamagingMove)
        return;
    var attackDroppingMoves = ['Trop Kick'];
    var specialAttackDroppingMoves = ['Skitter Smack'];
    var defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');
    if (attackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasPhysicalMoves(considerations.playerMon) ? 6 : 5);
    }
    else if (specialAttackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasSpecialMoves(considerations.playerMon) ? 6 : 5);
    }
}
exports.damagingAttackSpAttackReductionWithGuarnateedEffect = damagingAttackSpAttackReductionWithGuarnateedEffect;
function damagingMinus2SpDefReductionWithGuaranteedEffect(moveScore) {
    if (moveScore.move.move.named('Acid Spray'))
        moveScore.addScore(6);
}
exports.damagingMinus2SpDefReductionWithGuaranteedEffect = damagingMinus2SpDefReductionWithGuaranteedEffect;
function hasSpecialMoves(pokemon) {
    return !!pokemon.moves.find(function (m) { return createMove(pokemon, m).category === 'Special'; });
}
exports.hasSpecialMoves = hasSpecialMoves;
function hasPhysicalMoves(pokemon) {
    return !!pokemon.moves.find(function (m) { return createMove(pokemon, m).category === 'Physical'; });
}
exports.hasPhysicalMoves = hasPhysicalMoves;
function damagingTrappingMoves(moveScore) {
    if (['Whirlpool', 'Fire Spin', 'Sand Tomb', 'Magma Storm', 'Infestation', 'Jaw Lock'].includes(moveScore.move.move.name)) {
        moveScore.addAlternativeScores(6, 0.8, 8);
    }
}
exports.damagingTrappingMoves = damagingTrappingMoves;
function damagingSpeedReductionMoves(moveScore, considerations) {
    if (considerations.isHighestDamagingMove)
        return;
    var defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');
    if (['Icy Wind', 'Rock Tomb', 'Mud Shot', 'Low Sweep'].includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && considerations.aiIsSlower ? 6 : 5);
    }
}
exports.damagingSpeedReductionMoves = damagingSpeedReductionMoves;
function damagingPriorityMoves(moveScore, considerations) {
    if (considerations.result.move.priority > 0 && considerations.aiIsSlower && considerations.kos) {
        moveScore.addScore(11);
    }
}
exports.damagingPriorityMoves = damagingPriorityMoves;
function allDamagingMoves(moveScore, considerations) {
    if (considerations.result.move.category === 'Status')
        return;
    if (considerations.isHighestDamagingMove || considerations.kos) {
        moveScore.addAlternativeScores(6, 0.8, 8);
    }
    if (considerations.kos) {
        if (considerations.aiIsFaster || (considerations.aiIsSlower && considerations.result.move.priority > 0)) {
            moveScore.addScore(6);
        }
        if (!considerations.aiIsFaster) {
            moveScore.addScore(3);
        }
        if (considerations.aiMon.hasAbility('Moxie', 'Beast Boost', 'Chilling Neigh', 'Grim Neigh')) {
            moveScore.addScore(1);
        }
    }
}
exports.allDamagingMoves = allDamagingMoves;
function specificMoves(moveScore, consideration) {
    var _a, _b;
    var moveName = moveScore.move.move.name;
    switch (moveName) {
        case 'Future Sight':
            moveScore.addScore(consideration.aiIsFaster && consideration.playerWillKOAI ?
                8 : 6);
            break;
        case 'Relic Song':
            if (moveScore.move.attacker.named('Meloetta')) {
                moveScore.addScore(10);
            }
            else {
                moveScore.setScore(-20);
            }
            break;
        case 'Sucker Punch':
            if ((_a = consideration.lastTurnCPUMove) === null || _a === void 0 ? void 0 : _a.named('Sucker Punch')) {
                moveScore.addScore(-2, 0.5);
            }
            break;
        case 'Pursuit':
            if (consideration.kos) {
                moveScore.addScore(10);
            }
            else {
                var playerHPPercentage = consideration.playerMon.curHP() / consideration.playerMon.maxHP();
                if (playerHPPercentage < 0.2)
                    moveScore.addScore(10);
                if (playerHPPercentage < 0.4)
                    moveScore.addScore(8, 0.5);
                if (consideration.aiIsFaster)
                    moveScore.addScore(3);
            }
            break;
        case 'Fell Stinger':
            if (consideration.aiMon.boosts.atk < 6 && consideration.kos) {
                if (consideration.aiIsFaster) {
                    moveScore.setAlternativeScores(21, 0.8, 23);
                }
                else {
                    moveScore.addAlternativeScores(15, 0.8, 17);
                }
            }
            break;
        case 'Rollout':
            moveScore.setScore(7);
            break;
        case 'Stealth Rock':
            if (consideration.field.defenderSide.isSR)
                break;
            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(8, 0.25, 9);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 7);
            }
            break;
        case 'Spikes':
        case 'Toxic Spikes':
            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(8, 0.25, 9);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 7);
            }
            if (consideration.field.defenderSide.spikes)
                moveScore.addScore(-1);
            break;
        case 'Sticky Web':
            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(9, 0.25, 12);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 9);
            }
            break;
        case 'Protect':
        case "King's Shield":
            moveScore.addScore(6);
            if (consideration.aiMon.hasStatus('psn', 'brn'))
                moveScore.addScore(-2);
            if (consideration.playerMon.hasStatus('psn', 'brn'))
                moveScore.addScore(1);
            if (consideration.aiMonFirstTurnOut)
                moveScore.addScore(-1);
            if ((consideration.aiMon.hasStatus('psn') && consideration.aiMon.curHP() <= Math.floor(consideration.aiMon.maxHP() / 8)) ||
                (consideration.aiMon.hasStatus('brn') && consideration.aiMon.curHP() <= Math.floor(consideration.aiMon.maxHP() / 16)))
                moveScore.never();
            if ((_b = consideration.lastTurnCPUMove) === null || _b === void 0 ? void 0 : _b.named('Protect', "King's Shield"))
                moveScore.never(0.5);
            break;
        case 'Imprison':
            if (consideration.playerMon.moves.some(function (playerMove) { return consideration.aiMon.moves.includes(playerMove); })) {
                moveScore.addScore(9);
            }
            else {
                moveScore.setScore(-20);
            }
            break;
        case 'Baton Pass':
            (0, notImplementedError_1.notImplemented)();
        case 'Tailwind':
            moveScore.addScore(consideration.aiIsSlower ? 9 : 5);
            break;
        case 'Trick Room':
            moveScore.addScore(consideration.aiIsSlower ? 10 : 5);
            if (consideration.field.isTrickRoom)
                moveScore.setScore(-20);
            break;
        case 'Fake Out':
            if (consideration.aiMonFirstTurnOut && !consideration.playerMon.hasAbility('Inner Focus'))
                moveScore.addScore(9);
            break;
        case 'Helping Hand':
        case 'Follow Me':
            (0, notImplementedError_1.notImplemented)();
        case 'Final Gambit':
            if (consideration.aiIsFaster && consideration.aiMon.curHP() > consideration.playerMon.curHP())
                moveScore.addScore(8);
            else if (consideration.aiIsFaster && consideration.playerWillKOAI)
                moveScore.addScore(7);
            else
                moveScore.addScore(6);
            break;
        case 'Electric Terrain':
        case 'Grassy Terrain':
        case 'Misty Terrain':
        case 'Psychic Terrain':
            if (consideration.field.terrain === moveName) {
                moveScore.never();
            }
            else {
                moveScore.addScore(consideration.aiMon.hasItem('Terrain Extender') ? 9 : 8);
            }
            break;
        case 'Light Screen':
        case 'Reflect':
            if (moveName === 'Light Screen' && consideration.field.attackerSide.isLightScreen ||
                moveName === 'Reflect' && consideration.field.attackerSide.isReflect) {
                moveScore.never();
                break;
            }
            moveScore.addScore(6);
            if (moveName === 'Light Screen' && hasSpecialMoves(consideration.playerMon) ||
                moveName === 'Reflect' && hasPhysicalMoves(consideration.playerMon)) {
                if (consideration.aiMon.hasItem('Light Clay'))
                    moveScore.addScore(1);
                moveScore.addScore(1, 0.5);
            }
            break;
    }
}
exports.specificMoves = specificMoves;
function generalSetup(moveScore, consideration) {
    if (![
        'Power-up Punch',
        'Swords Dance',
        'Howl',
        'Stuff Cheeks',
        'Barrier',
        'Acid Armor',
        'Iron Defense',
        'Cotton Guard',
        'Charge Beam',
        'Tail Glow',
        'Nasty Plot',
        'Cosmic Power',
        'Bulk Up',
        'Calm Mind',
        'Dragon Dance',
        'Coil',
        'Hone Claws',
        'Quiver Dance',
        'Shift Gear',
        'Shell Smash',
        'Growth',
        'Work Up',
        'Curse',
        'Coil',
        'No Retreat'
    ].includes(moveScore.move.move.name))
        return;
    if (consideration.playerWillKOAI ||
        consideration.playerMon.hasAbility('Unaware') && !['Power-up Punch', 'Swords Dance', 'Howl'].includes(moveScore.move.move.name))
        return moveScore.addScore(-20);
}
exports.generalSetup = generalSetup;
function offensiveSetup(moveScore, consideration) {
    if (![
        'Dragon Dance',
        'Shift Gear',
        'Swords Dance',
        'Howl',
        'Sharpen',
        'Meditate',
        'Hone Claws'
    ].includes(moveScore.move.move.name))
        return;
    moveScore.addScore(6);
    if (consideration.playerMon.hasStatus('frz', 'slp'))
        moveScore.addScore(3);
    if (consideration.aiIsSlower && consideration.playerWill2HKOAI)
        moveScore.addScore(-5);
}
exports.offensiveSetup = offensiveSetup;
function defensiveSetup(moveScore, consideration) {
    if (![
        'Acid Armor',
        'Barrier',
        'Cotton Guard',
        'Harden',
        'Iron Defense',
        'Stockpile',
        'Cosmic Power'
    ].includes(moveScore.move.move.name))
        return;
    moveScore.addScore(6);
    if (consideration.aiIsSlower && consideration.playerWill2HKOAI)
        moveScore.addScore(-5);
    if (consideration.playerMon.hasStatus('frz', 'slp'))
        moveScore.addScore(2, 0.95);
    if (['Stockpile',
        'Cosmic Power'].includes(moveScore.move.move.name) &&
        consideration.aiMon.boosts.def < 2 || consideration.aiMon.boosts.spd < 2)
        moveScore.addScore(2);
}
exports.defensiveSetup = defensiveSetup;
function recovery(moveScore, consideration) {
    (0, notImplementedError_1.notImplemented)();
}
exports.recovery = recovery;
function isSuperEffective(move, defendingPokemon) {
    (0, notImplementedError_1.notImplemented)();
}
exports.isSuperEffective = isSuperEffective;
function hasHighCritChance(move) {
    (0, notImplementedError_1.notImplemented)();
}
exports.hasHighCritChance = hasHighCritChance;
function specialExecptionNotHighestDamagingMove() {
    (0, notImplementedError_1.notImplemented)();
}
function findHighestDamageMove(moveResults) {
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
            if (moveResults_1_1 && !moveResults_1_1.done && (_a = moveResults_1.return)) _a.call(moveResults_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return maxDamageMove;
}
exports.findHighestDamageMove = findHighestDamageMove;
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
        var getDamagePct = function (hitDamage) { return hitDamage * (createMove(attacker, attacker.moves[i]).hits / defender.stats.hp * 100); };
        return {
            attacker: attacker,
            defender: defender,
            move: result.move,
            lowestRollDamage: lowestHitDamage,
            lowestRollHpPercentage: getDamagePct(lowestHitDamage),
            highestRollDamage: highestHitDamage,
            highestRollHpPercentage: getDamagePct(highestHitDamage),
        };
    });
}
exports.getDamageRanges = getDamageRanges;
function savedFromKO(pokemon) {
    return hasLifeSavingAbility(pokemon) || hasLifeSavingItem(pokemon);
}
exports.savedFromKO = savedFromKO;
function hasLifeSavingItem(pokemon) {
    return pokemon.hasItem('Focus Sash') && pokemon.curHP() === pokemon.maxHP();
}
exports.hasLifeSavingItem = hasLifeSavingItem;
function hasLifeSavingAbility(pokemon) {
    return pokemon.hasAbility('Sturdy') && pokemon.curHP() === pokemon.maxHP();
}
exports.hasLifeSavingAbility = hasLifeSavingAbility;
function canUseDamagingMoves(pokemon) {
    return pokemon.moves.map(function (m) { return createMove(pokemon, m); }).some(function (m) { return m.category !== 'Status'; });
}
exports.canUseDamagingMoves = canUseDamagingMoves;
function createMove(pokemon, moveName) {
    return new move_1.Move(pokemon.gen, moveName, { ability: pokemon.ability, item: pokemon.item, species: pokemon.species.name });
}
exports.createMove = createMove;
//# sourceMappingURL=moveScoring.js.map