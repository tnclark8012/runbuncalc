"use strict";
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
var dex_1 = require("@pkmn/dex");
var field_1 = require("../field");
var simulator_1 = require("../simulator");
var gen_1 = require("./gen");
var helper_1 = require("./helper");
var RunAndBun = 8;
(0, helper_1.inGen)(RunAndBun, function (_a) {
    var gen = _a.gen, calculate = _a.calculate, Pokemon = _a.Pokemon, Move = _a.Move;
    describe('Custom tests for calculator', function () {
        describe('Move selection', function () {
            test("Slower CPU wins with a priority move", function () {
                var _a = __read((0, helper_1.importTeam)("\nLopunny\nLevel: 1\n- Fake out\n- Hyper Beam\n\nAerodactyl\nLevel: 100\n- Stone Edge\n"), 2), cpu = _a[0], player = _a[1];
                player.originalCurHP = 1;
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), player, cpu, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult();
                expect(result.winner.name).toEqual('Lopunny');
            });
            test("CPU thinks it lives with focus sash, so doesn't go for priority. Player sees focus sash and goes for multi-hit", function () {
                var _a = __read((0, helper_1.importTeam)("\nKrabby @ Focus Sash\nLevel: 1\n- Aqua Jet\n- Crabhammer\n\nAerodactyl\nLevel: 12\n- Stone Edge\n- Dual Wingbeat\n"), 2), cpuKrabby = _a[0], playerAerodactyl = _a[1];
                expect(playerAerodactyl.stats.spe).toBeGreaterThan(cpuKrabby.stats.spe);
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), playerAerodactyl, cpuKrabby, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult();
                expect(result.turnOutcomes.length).toBe(1);
                expectTurn(result.turnOutcomes[0], { pokemon: playerAerodactyl, move: 'Dual Wingbeat' });
                expect(result.winner.name).toEqual('Aerodactyl');
                expect(result.turnOutcomes[0].battleFieldState.cpuPokemon.item).toBeUndefined();
            });
        });
        describe('Turn sequence', function () {
            test('stat changes from moves take effect after the turn', function () {
                var _a = __read((0, helper_1.importTeam)("\nKrabby\nLevel: 100\n- Swords Dance\n\nInfernape\nLevel: 5\n- Close Combat\n"), 2), cpuKrabby = _a[0], playerInfernape = _a[1];
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), playerInfernape, cpuKrabby, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult(1);
                expect(result.turnOutcomes.length).toBe(1);
                expectTurn(result.turnOutcomes[0], { pokemon: cpuKrabby, move: 'Swords Dance' }, { pokemon: playerInfernape, move: 'Close Combat' });
                expect(result.turnOutcomes[0].battleFieldState.cpuPokemon.boosts.atk).toBe(2);
                expect(result.turnOutcomes[0].battleFieldState.playerPokemon.boosts.def).toBe(-1);
                expect(result.turnOutcomes[0].battleFieldState.playerPokemon.boosts.spd).toBe(-1);
            });
        });
        describe('Run & Bun Battles', function () {
            test('Brawly - Tirtouga vs. Combusken: Riskless', function () {
                var _a = __read((0, helper_1.importTeam)("\nTirtouga\nLevel: 21\nHardy Nature\nAbility: Solid Rock\nIVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe\n- Smack Down\n- Brine\n- Aqua Jet\n- Bite\n\nCombusken @ Lum Berry\nLevel: 20\nNaughty Nature\nAbility: Speed Boost\n- Double Kick\n- Incinerate\n- Thunder Punch\n- Work Up\n"), 2), tirtouga = _a[0], combusken = _a[1];
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), tirtouga, combusken, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult();
                expectTurn(result.turnOutcomes[0], { pokemon: combusken, move: 'Double Kick' }, { pokemon: tirtouga, move: 'Brine' });
                expect(result.turnOutcomes[0].battleFieldState.cpuPokemon.boosts.spe).toBe(1);
                expectTurn(result.turnOutcomes[1], { pokemon: tirtouga, move: 'Aqua Jet' });
            });
            test('Ninja Boy Lung - Corviknight vs. Greninja: Slow KOs because of Protean type change', function () {
                var _a = __read((0, helper_1.importTeam)("\nCorviknight\nLevel: 48\nCalm\nAbility: Unnerve\nIVs: 13 HP / 2 Atk / 16 Def / 23 SpA / 21 SpD / 14 Spe\n- Brave Bird\n- Body Press\n- Scary Face\n- Feather Dance\n\nGreninja\nLevel: 45\nHasty Nature\nAbility: Protean\n- Water Shuriken\n- Gunk Shot\n- Acrobatics\n- Low Kick\n"), 2), Corviknight = _a[0], Greninja = _a[1];
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), Corviknight, Greninja, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult();
                expectTurn(result.turnOutcomes[0], { pokemon: Greninja, move: 'Low Kick' }, { pokemon: Corviknight, move: 'Brave Bird' });
                expect(result.winner.id).toBe(Corviknight.id);
            });
            test('Team Aqua Grunt Aqua Hideout #7 - Gilscor vs. Cloyster: Skill link Icicle Spear KOs', function () {
                var _a = __read((0, helper_1.importTeam)("\nCloyster\nLevel: 81\nLax Nature\nAbility: Skill Link\nIVs: 5 HP / 27 Atk / 13 Def / 21 SpA / 10 SpD / 18 Spe\n- Rapid Spin\n- Ice Shard\n- Icicle Spear\n- Rock Blast\n\nGliscor @ Toxic Orb\nLevel: 79\nJolly Nature\nAbility: Poison Heal\n- Earthquake\n- Dual Wingbeat\n- Facade\n- Swords Dance\n"), 2), Cloyster = _a[0], Gilscor = _a[1];
                var battleSimulator = new simulator_1.BattleSimulator(new gen_1.Generations(dex_1.Dex).get(gen), Cloyster, Gilscor, new field_1.Field(), new field_1.Field());
                var result = battleSimulator.getResult();
                expectTurn(result.turnOutcomes[0], { pokemon: Gilscor, move: 'Earthquake' }, { pokemon: Cloyster, move: 'Icicle Spear' });
                expect(result.winner.id).toBe(Cloyster.id);
            });
        });
    });
    function expectTurn(turn, firstMover, secondMover) {
        var first = turn.actions[0];
        var second = turn.actions[1];
        expect("1. ".concat(first.attacker.name, " - ").concat(first.move.name)).toBe("1. ".concat(firstMover.pokemon.name, " - ").concat(firstMover.move));
        if (secondMover) {
            expect("2. ".concat(second.attacker.name, " - ").concat(second.move.name)).toBe("2. ".concat(secondMover.pokemon.name, " - ").concat(secondMover.move));
        }
        else {
            expect(turn.actions[1]).toBeUndefined();
        }
    }
});
//# sourceMappingURL=simulator.test.js.map