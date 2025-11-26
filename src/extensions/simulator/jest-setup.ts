import { MoveAction, PossibleAction, SwitchAction } from "./phases/battle/move-selection.contracts";

export type ExpectedMoveAction = Omit<MoveAction, 'move'> & {
  move: Omit<MoveAction['move'], 'move'> & {
    move: string;
  };
};

export type ExpectedAction = SwitchAction | ExpectedMoveAction;

export type ExpectedPossibleAction = ExpectedAction & {
  probability: number;
};

declare global {
  namespace jest {
    interface Matchers<R> {
      toBePossibleAction(expected: ExpectedPossibleAction): R;
    }
  }
}

expect.extend({
  toBePossibleAction(received: PossibleAction, expected: ExpectedPossibleAction) {
    // Check probability
    if (received.probability !== expected.probability) {
      return {
        message: () =>
          `expected probability ${this.utils.printReceived(received.probability)} to equal ${this.utils.printExpected(expected.probability)}`,
        pass: false,
      };
    }

    // Check action type
    if (received.type !== expected.type) {
      return {
        message: () =>
          `expected action type ${this.utils.printReceived(received.type)} to equal ${this.utils.printExpected(expected.type)}`,
        pass: false,
      };
    }

    // For move actions, compare move name
    if (received.type === 'move' && expected.type === 'move') {
      const receivedMoveName = received.move.move.name;
      const expectedMoveName = expected.move.move;

      if (receivedMoveName !== expectedMoveName) {
        return {
          message: () =>
            `expected move ${this.utils.printReceived(receivedMoveName)} to equal ${this.utils.printExpected(expectedMoveName)}`,
          pass: false,
        };
      }
      
      // Also check target
      const receivedTarget = JSON.stringify(received.move.target);
      const expectedTarget = JSON.stringify(expected.move.target);
      
      if (receivedTarget !== expectedTarget) {
        return {
          message: () =>
            `expected target ${this.utils.printReceived(receivedTarget)} to equal ${this.utils.printExpected(expectedTarget)}`,
          pass: false,
        };
      }
    }

    // For switch actions, compare Pokemon name
    if (received.type === 'switch' && expected.type === 'switch') {
      const receivedPokemon = received.switchIn?.name;
      const expectedPokemon = expected.switchIn?.name;

      if (receivedPokemon !== expectedPokemon) {
        return {
          message: () =>
            `expected switchIn ${this.utils.printReceived(receivedPokemon)} to equal ${this.utils.printExpected(expectedPokemon)}`,
          pass: false,
        };
      }
    }

    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} not to match ${this.utils.printExpected(expected)}`,
      pass: true,
    };
  },
});

// Load gen8.js to populate SETDEX_SS global
// This is needed because Jest doesn't execute imported JS files the same way browsers do
const fs = require('fs');
const path = require('path');
const gen8Path = path.join(__dirname, '../../js/data/sets/gen8.js');
const gen8Code = fs.readFileSync(gen8Path, 'utf8');

// Execute in global context to make SETDEX_SS available globally
(0, eval)(gen8Code);
// Also ensure it's on the global object
if (typeof SETDEX_SS !== 'undefined') {
  (global as any).SETDEX_SS = SETDEX_SS;
}

export { };

