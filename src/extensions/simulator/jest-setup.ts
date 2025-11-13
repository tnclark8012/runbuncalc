import { PossibleAction, MoveAction, SwitchAction } from "./phases/battle/move-selection.contracts";

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

export {};
