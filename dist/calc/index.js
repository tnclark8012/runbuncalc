"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });

var data_1 = require("./data");
var A = __importStar(require("./adaptable"));
var simulator_1 = require("./simulator");
var Acalculate = exports.calculate;
function simulateAllMatchups(gen, cpuPokemon, playerPokemon, field) {
    return playerPokemon.map(function (playerPokemon) {
        return simulate(gen, playerPokemon, cpuPokemon, field);
    });
}
exports.simulateAllMatchups = simulateAllMatchups;
function simulate(gen, attacker, defender, field) {
    var simulator = new simulator_1.BattleSimulator(toGeneration(gen), attacker, defender, field, field === null || field === void 0 ? void 0 : field.clone().swap());
    try {
        var result = simulator.getResult();
        return result;
    }
    catch (e) {
        alert(e);
    }
    return;
}
exports.simulate = simulate;
function calculate(gen, attacker, defender, move, field) {
    return (Acalculate || A.calculate)(toGeneration(gen), attacker, defender, move, field);
}
exports.calculate = calculate;
var Move = (function (_super) {
    __extends(Move, _super);
    function Move(gen, name, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, typeof gen === 'number' ? data_1.Generations.get(gen) : gen, name, options) || this;
    }
    return Move;
}(A.Move));
exports.Move = Move;
var Pokemon = (function (_super) {
    __extends(Pokemon, _super);
    function Pokemon(gen, name, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, typeof gen === 'number' ? data_1.Generations.get(gen) : gen, name, options) || this;
    }
    Pokemon.getForme = function (gen, speciesName, item, moveName) {
        return A.Pokemon.getForme(typeof gen === 'number' ? data_1.Generations.get(gen) : gen, speciesName, item, moveName);
    };
    return Pokemon;
}(A.Pokemon));
exports.Pokemon = Pokemon;
function calcStat(gen, stat, base, iv, ev, level, nature) {
    return A.Stats.calcStat(typeof gen === 'number' ? data_1.Generations.get(gen) : gen, stat === 'spc' ? 'spa' : stat, base, iv, ev, level, nature);
}
exports.calcStat = calcStat;
var field_1 = require("./field");
Object.defineProperty(exports, "Field", { enumerable: true, get: function () { return field_1.Field; } });
Object.defineProperty(exports, "Side", { enumerable: true, get: function () { return field_1.Side; } });
var result_1 = require("./result");
Object.defineProperty(exports, "Result", { enumerable: true, get: function () { return result_1.Result; } });
var index_1 = require("./data/index");
Object.defineProperty(exports, "Generations", { enumerable: true, get: function () { return index_1.Generations; } });
var util_1 = require("./util");
Object.defineProperty(exports, "toID", { enumerable: true, get: function () { return util_1.toID; } });
var abilities_1 = require("./data/abilities");
Object.defineProperty(exports, "ABILITIES", { enumerable: true, get: function () { return abilities_1.ABILITIES; } });
var items_1 = require("./data/items");
Object.defineProperty(exports, "ITEMS", { enumerable: true, get: function () { return items_1.ITEMS; } });
Object.defineProperty(exports, "MEGA_STONES", { enumerable: true, get: function () { return items_1.MEGA_STONES; } });
var moves_1 = require("./data/moves");
Object.defineProperty(exports, "MOVES", { enumerable: true, get: function () { return moves_1.MOVES; } });
var species_1 = require("./data/species");
Object.defineProperty(exports, "SPECIES", { enumerable: true, get: function () { return species_1.SPECIES; } });
var natures_1 = require("./data/natures");
Object.defineProperty(exports, "NATURES", { enumerable: true, get: function () { return natures_1.NATURES; } });
var types_1 = require("./data/types");
Object.defineProperty(exports, "TYPE_CHART", { enumerable: true, get: function () { return types_1.TYPE_CHART; } });
var stats_1 = require("./stats");
Object.defineProperty(exports, "STATS", { enumerable: true, get: function () { return stats_1.STATS; } });
Object.defineProperty(exports, "Stats", { enumerable: true, get: function () { return stats_1.Stats; } });
function toGeneration(gen) {
    return typeof gen === 'number' ? data_1.Generations.get(gen) : gen;
}
//# sourceMappingURL=index.js.map