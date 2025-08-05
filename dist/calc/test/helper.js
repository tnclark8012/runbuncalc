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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });

var index_1 = require("../index");
var field_1 = require("../field");
var notImplementedError_1 = require("../notImplementedError");
var calc = function (gen) { return function (attacker, defender, move, field) { return (0, index_1.calculate)(gen, attacker, defender, move, field); }; };
var move = function (gen) { return function (name, options) {
    if (options === void 0) { options = {}; }
    return new index_1.Move(gen, name, options);
}; };
var pokemon = function (gen) { return function (name, options) {
    if (options === void 0) { options = {}; }
    return new index_1.Pokemon(gen, name, options);
}; };
var field = function (field) {
    if (field === void 0) { field = {}; }
    return new field_1.Field(field);
};
var side = function (side) {
    if (side === void 0) { side = {}; }
    return new field_1.Side(side);
};
function inGen(gen, fn) {
    fn({
        gen: gen,
        calculate: calc(gen),
        Move: move(gen),
        Pokemon: pokemon(gen),
        Field: field,
        Side: side,
    });
}
exports.inGen = inGen;
function inGens(from, to, fn) {
    for (var gen = from; gen <= to; gen++) {
        inGen(gen, fn);
    }
}
exports.inGens = inGens;
function tests() {
    var _a, _b, _c;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var name = args[0];
    var from;
    var to;
    var fn;
    var type = undefined;
    if (typeof args[1] !== 'number') {
        from = 1;
        to = 8;
        fn = args[1];
        type = args[2];
    }
    else if (typeof args[2] !== 'number') {
        from = (_a = args[1]) !== null && _a !== void 0 ? _a : 1;
        to = 8;
        fn = args[2];
        type = args[3];
    }
    else {
        from = (_b = args[1]) !== null && _b !== void 0 ? _b : 1;
        to = (_c = args[2]) !== null && _c !== void 0 ? _c : 8;
        fn = args[3];
        type = args[4];
    }
    inGens(from, to, function (gen) {
        var n = "".concat(name, " (gen ").concat(gen.gen, ")");
        if (type === 'skip') {
            test.skip(n, function () { return fn(gen); });
        }
        else if (type === 'only') {
            test.only(n, function () { return fn(gen); });
        }
        else {
            test(n, function () { return fn(gen); });
        }
    });
}
exports.tests = tests;
expect.extend({
    toMatch: function (received, gen, notation, diff) {
        var e_1, _a;
        if (typeof notation !== 'string') {
            diff = notation;
            notation = '%';
        }
        if (!diff)
            throw new Error('toMatch called with no diff!');
        var breakdowns = Object.entries(diff).sort();
        var expected = { range: undefined, desc: '', result: '' };
        try {
            for (var breakdowns_1 = __values(breakdowns), breakdowns_1_1 = breakdowns_1.next(); !breakdowns_1_1.done; breakdowns_1_1 = breakdowns_1.next()) {
                var _b = __read(breakdowns_1_1.value, 2), g = _b[0], _c = _b[1], range = _c.range, desc = _c.desc, result = _c.result;
                if (Number(g) > gen)
                    break;
                if (range)
                    expected.range = range;
                if (desc)
                    expected.desc = desc;
                if (result)
                    expected.result = result;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (breakdowns_1_1 && !breakdowns_1_1.done && (_a = breakdowns_1.return)) _a.call(breakdowns_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (!(expected.range || expected.desc || expected.result)) {
            throw new Error("toMatch called with empty diff: ".concat(diff));
        }
        if (expected.range) {
            if (this.isNot) {
                expect(received.range()).not.toEqual(expected.range);
            }
            else {
                expect(received.range()).toEqual(expected.range);
            }
        }
        if (expected.desc) {
            var r = received.fullDesc(notation).split(': ')[0];
            if (this.isNot) {
                expect(r).not.toEqual(expected.desc);
            }
            else {
                expect(r).toEqual(expected.desc);
            }
        }
        if (expected.result) {
            var post = received.fullDesc(notation).split(': ')[1];
            var r = "(".concat(post.split('(')[1]);
            if (this.isNot) {
                expect(r).not.toEqual(expected.result);
            }
            else {
                expect(r).toEqual(expected.result);
            }
        }
        return { pass: !this.isNot, message: function () { return ''; } };
    },
});
var statToLegacyMap = {
    'hp': 'hp',
    'atk': 'at',
    'def': 'df',
    'spa': 'sa',
    'spd': 'sd',
    'spe': 'sp'
};
function importPokemon(importText) {
    return importTeam(importText)[0];
}
exports.importPokemon = importPokemon;
function importTeam(importText) {
    var rows = importText.trim().split("\n");
    rows = rows.map(function (r) { return r.trim(); });
    var currentRow;
    var currentPoke;
    var addedpokes = 0;
    var pokelist = [];
    for (var i = 0; i < rows.length; i++) {
        currentRow = rows[i].split(/[()@]/);
        for (var j = 0; j < currentRow.length; j++) {
            currentRow[j] = checkExeptions(currentRow[j].trim());
            if (index_1.SPECIES[9][currentRow[j].trim()] !== undefined) {
                var speciesData = index_1.SPECIES[9][currentRow[j].trim()];
                var stats = getStats(rows, i + 1);
                var moves = getMoves(rows, i);
                currentPoke = new index_1.Pokemon(9, currentRow[j].trim(), __assign({ item: getItem(currentRow, j + 1), name: currentRow[j].trim(), ability: getAbility(rows[i + 1].split(":")), moves: moves }, stats));
                pokelist.push(currentPoke);
                break;
            }
        }
    }
    return pokelist;
    function getAbility(row) {
        var ability = row[1] ? row[1].trim() : '';
        if (index_1.ABILITIES[9].indexOf(ability) !== -1)
            return ability;
        return;
    }
    function getStats(rows, offset) {
        var currentPoke = {};
        currentPoke.nature = "Serious";
        var currentEV;
        var currentIV;
        var currentAbility;
        var currentTeraType;
        var currentNature;
        currentPoke.level = 100;
        for (var x = offset; x < offset + 9; x++) {
            if (!rows[x] || !rows[x].length)
                return currentPoke;
            var currentRow = rows[x] ? rows[x].split(/[/:]/) : '';
            var evs = {};
            var ivs = {};
            var ev;
            var j;
            switch (currentRow[0]) {
                case 'Level':
                    currentPoke.level = parseInt(currentRow[1].trim());
                    continue;
                case 'EVs':
                    for (j = 1; j < currentRow.length; j++) {
                        currentEV = currentRow[j].trim().split(" ");
                        currentEV[1] = statToLegacyStat(currentEV[1].toLowerCase());
                        evs[currentEV[1]] = parseInt(currentEV[0]);
                    }
                    currentPoke.evs = evs;
                    continue;
                case 'IVs':
                    for (j = 1; j < currentRow.length; j++) {
                        currentIV = currentRow[j].trim().split(" ");
                        currentIV[1] = currentIV[1].toLowerCase();
                        ivs[currentIV[1]] = parseInt(currentIV[0]);
                    }
                    currentPoke.ivs = ivs;
                    continue;
            }
            currentAbility = rows[x] ? rows[x].trim().split(":") : '';
            if (currentAbility[0] == "Ability") {
                currentPoke.ability = currentAbility[1].trim();
            }
            currentNature = rows[x] ? rows[x].trim().split(" ") : '';
            if (currentNature[1] == "Nature") {
                currentPoke.nature = currentNature[0];
            }
        }
        return currentPoke;
    }
    function statToLegacyStat(stat) {
        return statToLegacyMap[stat];
    }
    function legacyStatToStat(legacyStat) {
        for (var stat in statToLegacyMap) {
            if (statToLegacyMap[stat] === legacyStat)
                return stat;
        }
        (0, notImplementedError_1.notImplemented)();
    }
    function checkExeptions(poke) {
        switch (poke) {
            case 'Aegislash':
                poke = "Aegislash-Blade";
                break;
            case 'Basculin-Blue-Striped':
                poke = "Basculin";
                break;
            case 'Gastrodon-East':
                poke = "Gastrodon";
                break;
            case 'Mimikyu-Busted-Totem':
                poke = "Mimikyu-Totem";
                break;
            case 'Mimikyu-Busted':
                poke = "Mimikyu";
                break;
            case 'Pikachu-Belle':
            case 'Pikachu-Cosplay':
            case 'Pikachu-Libre':
            case 'Pikachu-Original':
            case 'Pikachu-Partner':
            case 'Pikachu-PhD':
            case 'Pikachu-Pop-Star':
            case 'Pikachu-Rock-Star':
                poke = "Pikachu";
                break;
            case 'Vivillon-Fancy':
            case 'Vivillon-Pokeball':
                poke = "Vivillon";
                break;
            case 'Florges-White':
            case 'Florges-Blue':
            case 'Florges-Orange':
            case 'Florges-Yellow':
                poke = "Florges";
                break;
        }
        return poke;
    }
    function getItem(currentRow, j) {
        for (; j < currentRow.length; j++) {
            var item = currentRow[j].trim();
            if (index_1.ITEMS[9].indexOf(item) != -1) {
                return item;
            }
        }
        return;
    }
    function getMoves(rows, offset) {
        var movesFound = false;
        var moves = [];
        for (var x = offset; x < offset + 12; x++) {
            if (rows[x]) {
                if (rows[x][0] == "-") {
                    movesFound = true;
                    var move = rows[x].substr(2, rows[x].length - 2).replace("[", "").replace("]", "").replace("  ", "");
                    moves.push(move);
                }
                else {
                    if (movesFound == true) {
                        break;
                    }
                }
            }
        }
        return moves;
    }
}
exports.importTeam = importTeam;
//# sourceMappingURL=helper.js.map