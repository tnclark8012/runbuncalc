import { Field, Move, StatsTable} from '@smogon/calc';
import { calculateMoveResult } from './moveScoring';
import { playerRng } from '../configuration';
import { importTeam } from './test-helper';
import { MoveScore, ScoreModifier } from './moveScore';
import { MoveResult } from './moveScoring.contracts';

describe('MoveScore', () => {
  let moveResult: MoveResult;

  beforeAll(() => {
    let [Torkoal, Krabby] = importTeam(`
    Torkoal
    Level: 53
    Quiet Nature
    Ability: White Smoke
    - Flamethrower
    - Solar Beam
    - Scorching Sands
    - Stealth Rock
    
    Krabby
    Level: 50
    Serious Nature
    Ability: Hyper Cutter
    - Splash
    - Fake Tears
    - Aqua Jet
    - Waterfall
  `);
    
    moveResult  = calculateMoveResult(Torkoal, Krabby, 'Solar Beam', new Field(), playerRng);
  });

  test('addScore - 100% chance score', () => {
    const moveScore = new MoveScore(moveResult);
    moveScore.addScore(6);
    expectScores([new ScoreModifier(6, 1)], moveScore.getScores());
  });

  test('addScore - 20% chance', () => {
    const moveScore = new MoveScore(moveResult);
    moveScore.addScore(8, 0.2);
    expectScores([new ScoreModifier(8, 0.2), new ScoreModifier(0, 0.8)], moveScore.getScores());
  });

  test('addAlternativeScores' , () => {
    const moveScore = new MoveScore(moveResult);
    moveScore.addAlternativeScores(1, 0.5, 2);
    expectScores([new ScoreModifier(1, 0.5), new ScoreModifier(2, 0.5)], moveScore.getScores());
  });

  test('getScores collapses same score probabilities' , () => {
    const moveScore = new MoveScore(moveResult);
    moveScore.addScore(1, 0.5); // 0 - 50%, 1 - 50%
    moveScore.addScore(1, 0.5); // 0 - 25%, 1 - 25%, 1 - 25%, 2 - 25%
    //  0 - 25%, 1 - 50%, 2 - 25%
    expectScores([new ScoreModifier(0, 0.25), new ScoreModifier(1, 0.5), new ScoreModifier(2, 0.25)], moveScore.getScores());
  });

  function expectScores(expected: ScoreModifier[], actual: ScoreModifier[]): void {
    const sortScores = (a: ScoreModifier, b: ScoreModifier) => { 
      let scoreDiff = a.modifier - b.modifier;
      let percentChanceDiff = a.percentChance - b.percentChance;
      return scoreDiff ? scoreDiff : percentChanceDiff;
    };

    expected.sort(sortScores);
    actual.sort(sortScores);

    expect(actual).toEqual(expected);
  }
});
