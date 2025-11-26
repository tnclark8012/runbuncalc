import { processCartesianProduct } from './utils';

describe('Utils', () => {
  test('processCartesianProduct', () => {
    const totalCombinations = processCartesianProduct([
      new Array(16).fill(0),
      new Array(16).fill(0),
      new Array(16).fill(0),
      new Array(16).fill(0),
    ], () => {});
    expect(totalCombinations).toBe(65536);
  });
});