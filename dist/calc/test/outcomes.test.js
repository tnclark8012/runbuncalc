"use strict";
exports.__esModule = true;
var dex_1 = require("@pkmn/dex");
var field_1 = require("../field");
var matchup_1 = require("../matchup");
var gen_1 = require("./gen");
var helper_1 = require("./helper");
describe('Custom tests for calculator', function () {
    describe('Move selection', function () {
        (0, helper_1.inGen)(8, function (_a) {
            var gen = _a.gen, calculate = _a.calculate, Pokemon = _a.Pokemon, Move = _a.Move;
            test("CPU wins with a priority move", function () {
                var cpu = Pokemon('Lopunny', {
                    moves: ['Fake Out'],
                    level: 1
                });
                var player = Pokemon('Aerodactyl', {
                    moves: ['Stone Edge'],
                    level: 100,
                    curHP: 1
                });
                var battleSimulator = new matchup_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), player, cpu, new field_1.Field(), new field_1.Field());
                expect(battleSimulator.getResult().turnOutcomes).toEqual([]);
                expect(battleSimulator.getResult().winner.name).toBe(cpu.name);
            });
        });
    });
});
//# sourceMappingURL=outcomes.test.js.map