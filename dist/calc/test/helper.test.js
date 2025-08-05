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
var helper_1 = require("./helper");
describe('Helper', function () {
    test('importPokemon', function () {
        var pokemon = (0, helper_1.importPokemon)("\nKrabby @ Focus Sash\nLevel: 1\nHardy Nature\nAbility: Hyper Cutter\nIVs: 3 Atk\n- Aqua Jet\n- Crabhammer\n");
        var krabby = pokemon;
        expect(krabby.name).toBe('Krabby');
        expect(krabby.item).toBe('Focus Sash');
        expect(krabby.moves).toEqual(['Aqua Jet', 'Crabhammer']);
        expect(krabby.ivs).toEqual({
            atk: 3,
            def: 31,
            hp: 31,
            spa: 31,
            spd: 31,
            spe: 31
        });
        expect(krabby.ability).toBe('Hyper Cutter');
    });
    test('importTeam', function () {
        var _a = __read((0, helper_1.importTeam)("\n      Krabby\n      Level: 100\n      - Swords Dance\n      \n      Infernape\n      Level: 5\n      - Close Combat\n      "), 2), krabby = _a[0], ape = _a[1];
        expect(krabby.level).toBe(100);
        expect(ape.level).toBe(5);
    });
    test('Full sets', function () {
        var _a, _b;
        var tirtougaDef = "\nTirtouga\nLevel: 21\nHardy Nature\nAbility: Solid Rock\nIVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe\n- Smack Down\n- Brine\n- Aqua Jet\n- Bite";
        var combuskenDef = "\nCombusken @ Lum Berry\nLevel: 20\nNaughty Nature\nAbility: Speed Boost\n- Double Kick\n- Incinerate\n- Thunder Punch\n- Work Up";
        var tirtouga = (0, helper_1.importPokemon)(tirtougaDef);
        var combusken = (0, helper_1.importPokemon)(combuskenDef);
        expect(combusken.ability).toBe('Speed Boost');
        _a = __read((0, helper_1.importTeam)("".concat(tirtougaDef, "\n      ").concat(combuskenDef)), 2), tirtouga = _a[0], combusken = _a[1];
        expect(combusken.ability).toBe('Speed Boost');
        _b = __read((0, helper_1.importTeam)("\nTirtouga\nLevel: 21\nHardy Nature\nAbility: Solid Rock\nIVs: 15 HP / 31 Atk / 15 Def / 15 SpA / 15 SpD / 15 Spe\n- Smack Down\n- Brine\n- Aqua Jet\n- Bite\n\nCombusken @ Lum Berry\nLevel: 20\nNaughty Nature\nAbility: Speed Boost\n- Double Kick\n- Incinerate\n- Thunder Punch\n- Work Up\n"), 2), tirtouga = _b[0], combusken = _b[1];
        expect(combusken.ability).toBe('Speed Boost');
    });
});
//# sourceMappingURL=helper.test.js.map