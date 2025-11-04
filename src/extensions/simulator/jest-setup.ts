import { PossibleAction, MoveAction, SwitchAction } from "./phases/battle/move-selection.contracts";

export type ExpectedMoveAction = Omit<MoveAction, 'move'> & {
  move: Omit<MoveAction['move'], 'move'> & {
    move: string;
  };
};

export type ExpectedAction = SwitchAction | ExpectedMoveAction;

export type ExpectedPossibleAction = Omit<PossibleAction, 'action'> & {
  action: ExpectedAction;
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
    if (received.action.type !== expected.action.type) {
      return {
        message: () =>
          `expected action type ${this.utils.printReceived(received.action.type)} to equal ${this.utils.printExpected(expected.action.type)}`,
        pass: false,
      };
    }

    // For move actions, compare move name
    if (received.action.type === 'move' && expected.action.type === 'move') {
      const receivedMoveName = received.action.move.move.name;
      const expectedMoveName = expected.action.move.move;
      
      if (receivedMoveName !== expectedMoveName) {
        return {
          message: () =>
            `expected move ${this.utils.printReceived(receivedMoveName)} to equal ${this.utils.printExpected(expectedMoveName)}`,
          pass: false,
        };
      }
      
      // Also check target
      const receivedTarget = JSON.stringify(received.action.move.target);
      const expectedTarget = JSON.stringify(expected.action.move.target);
      
      if (receivedTarget !== expectedTarget) {
        return {
          message: () =>
            `expected target ${this.utils.printReceived(receivedTarget)} to equal ${this.utils.printExpected(expectedTarget)}`,
          pass: false,
        };
      }
    }

    // For switch actions, compare Pokemon name
    if (received.action.type === 'switch' && expected.action.type === 'switch') {
      const receivedPokemon = received.action.switchIn.name;
      const expectedPokemon = expected.action.switchIn.name;
      
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
