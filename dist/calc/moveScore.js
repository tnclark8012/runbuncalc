"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var MoveScore = (function () {
    function MoveScore(move) {
        this.move = move;
        this.potentialScores = [];
    }
    Object.defineProperty(MoveScore.prototype, "finalScore", {
        get: function () {
            if (this.fixedScore) {
                return this.fixedScore.modifier;
            }
            return this.potentialScores.reduce(function (soFar, current) {
                if (current.percentChance >= 0.5) {
                    soFar += current.modifier;
                }
                return soFar;
            }, 0);
        },
        enumerable: false,
        configurable: true
    });
    MoveScore.prototype.addScore = function (modifier, percentChance) {
        if (percentChance === void 0) { percentChance = 1; }
        this.potentialScores.push(new ScoreModifier(modifier, percentChance));
    };
    MoveScore.prototype.addAlternativeScores = function (modifier1, modifier1Chance, modifier2) {
        this.addScore(modifier1Chance >= 0.5 ? modifier1 : modifier2);
    };
    MoveScore.prototype.never = function (percentChance) {
        this.setScore(-999, percentChance);
    };
    MoveScore.prototype.setScore = function (newScore, percentChance) {
        if (percentChance === void 0) { percentChance = 1; }
        this.fixedScore = { modifier: newScore, percentChance: percentChance };
    };
    MoveScore.prototype.setAlternativeScores = function (modifier1, modifier1Chance, modifier2) {
        this.setScore(modifier1Chance >= 0.5 ? modifier1 : modifier2);
    };
    return MoveScore;
}());
exports.MoveScore = MoveScore;
var ScoreModifier = (function () {
    function ScoreModifier(modifier, percentChance) {
        this.modifier = modifier;
        this.percentChance = percentChance;
    }
    return ScoreModifier;
}());
exports.ScoreModifier = ScoreModifier;
//# sourceMappingURL=moveScore.js.map